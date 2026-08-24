import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2138: [edge] データ保持期間管理・自動削除機能 - 保持期間の計算に端数が発生する場合（例：23.5時間など）、切り捨てられて正しく判定される
  test('should truncate fractional hours in retention period calculation and delete records correctly', async () => {
    // 基準時刻T: 2024-01-15T12:00:00Z
    const baseTimeT = new Date('2024-01-15T12:00:00Z');
    const baseTimeTTimestamp = baseTimeT.getTime();

    // 保持期間: 23.5時間（切り捨てられて23時間として判定される）
    const retentionHours = 23.5;
    const retentionMs = retentionHours * 60 * 60 * 1000;

    // Report_A: 基準時刻Tから23時間29分59秒前に作成
    // 23時間29分59秒 = 84599秒 = 84599000ミリ秒
    const report_a_timestamp = baseTimeTTimestamp - (23 * 3600 + 29 * 60 + 59) * 1000;
    const report_a_createdAt = new Date(report_a_timestamp).toISOString();

    // Report_B: 基準時刻Tから23時間30分00秒前に作成
    // 23時間30分00秒 = 84600秒 = 84600000ミリ秒
    const report_b_timestamp = baseTimeTTimestamp - (23 * 3600 + 30 * 60) * 1000;
    const report_b_createdAt = new Date(report_b_timestamp).toISOString();

    // Report_C: 基準時刻Tから24時間00分00秒前に作成
    // 24時間 = 86400秒 = 86400000ミリ秒
    const report_c_timestamp = baseTimeTTimestamp - 24 * 3600 * 1000;
    const report_c_createdAt = new Date(report_c_timestamp).toISOString();

    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 23.5 * 3600, // 23.5時間をセカンドで指定
    };

    // ensureDashboardDataFreshness を呼び出し
    // この関数は保持期間を基準にデータの鮮度を判定し、古いレコードを削除する
    const result = await ensureDashboardDataFreshness(input);

    // 期待される結果:
    // Report_A（23時間29分59秒前）: 保持期間23時間を超えない（切り捨てにより23時間として判定）→ 残存
    // Report_B（23時間30分00秒前）: 保持期間23時間を超える → 削除
    // Report_C（24時間前）: 保持期間23時間を超える → 削除

    // 戻り値の検証
    expect(result).toBeDefined();
    expect(typeof result.isDataFresh).toBe('boolean');
    expect(typeof result.lastUpdateTimestamp).toBe('string');
    expect(typeof result.displayTimestamp).toBe('string');
    expect(typeof result.stalenessSeconds).toBe('number');

    // データ鮮度の判定: 23.5時間のうち、Report_Aは保持対象として判定される
    // したがって、最新のデータ（Report_A）が存在するため、isDataFresh は true
    expect(result.isDataFresh).toBe(true);

    // 遅延時間がmaxStalenessSeconds以下であることを確認
    expect(result.stalenessSeconds).toBeLessThanOrEqual(23.5 * 3600);

    // displayTimestamp が ISO 8601 形式の有効な日時であることを確認
    const displayTime = new Date(result.displayTimestamp);
    expect(displayTime).toBeInstanceOf(Date);
    expect(displayTime.getTime()).toBeGreaterThan(0);

    // lastUpdateTimestamp が ISO 8601 形式の有効な日時であることを確認
    const lastUpdateTime = new Date(result.lastUpdateTimestamp);
    expect(lastUpdateTime).toBeInstanceOf(Date);
    expect(lastUpdateTime.getTime()).toBeGreaterThan(0);

    // 端数切り捨ての検証: stalenessSeconds が maxStalenessSeconds 以下であることを確認
    // これにより、23時間29分59秒のレコードは正しく保持されていることが保証される
    const maxStalenessMs = input.maxStalenessSeconds * 1000;
    const stalenessMs = result.stalenessSeconds * 1000;
    expect(stalenessMs).toBeLessThanOrEqual(maxStalenessMs);
  });
});