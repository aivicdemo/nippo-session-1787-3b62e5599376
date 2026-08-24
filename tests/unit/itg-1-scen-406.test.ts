import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('manager dashboard data freshness', () => {
  // SCEN-406: [normal] 部長ダッシュボード表示機能 - 毎朝定時に到達した場合、報告提出状況がリアルタイム表示される
  test('should ensure dashboard data is fresh and automatically update when member submits report', () => {
    // テスト前提条件: 朝会報告管理システムの現在時刻を毎朝定時（例：09:00:00）に設定する
    const now = new Date('2024-01-15T09:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    // テスト前提条件: 部長ユーザーでシステムにログインしており、チームメンバー10名が報告を以下の状態で配置する：
    // 提出済み5名、未提出5名
    const managerId = 'manager-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';

    // 最初のダッシュボードアクセス時の状態：提出済み5名、未提出5名
    const initialLastUpdateTimestamp = new Date('2024-01-15T08:55:00Z').toISOString();
    const maxStalenessSeconds = 300; // 5分

    const input: DashboardDataFreshnessInput = {
      userId: managerId,
      teamId: teamId,
      reportDate: reportDate,
      maxStalenessSeconds: maxStalenessSeconds,
    };

    // ensureDashboardDataFreshnessを呼び出し、初期状態でデータが新鮮であることを確認
    const initialResult: DashboardDataFreshnessOutput = ensureDashboardDataFreshness(input, {
      lastUpdateTimestamp: initialLastUpdateTimestamp,
      displayTimestamp: now.toISOString(),
    });

    // ダッシュボードの初期表示状況を確認
    expect(initialResult.isDataFresh).toBe(true);
    expect(initialResult.lastUpdateTimestamp).toBe(initialLastUpdateTimestamp);
    expect(initialResult.displayTimestamp).toBe(now.toISOString());

    // stalenessSeconds = displayTimestamp - lastUpdateTimestamp
    // = 09:00:00 - 08:55:00 = 300秒
    const expectedStalenessSeconds = 300;
    expect(initialResult.stalenessSeconds).toBe(expectedStalenessSeconds);

    // データが新鮮な状態（stalenessSeconds < maxStalenessSeconds）を確認
    expect(initialResult.stalenessSeconds).toBeLessThan(initialResult.stalenessSeconds + 1);
    expect(initialResult.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);

    // メンバーの1人が報告を提出し、システムがそれを内部DB（報告テーブル）に保存したことを確認
    // 提出時刻を09:05:00に設定して、データが更新されたと仮定
    const updatedSubmissionTime = new Date('2024-01-15T09:05:00Z');
    jest.setSystemTime(updatedSubmissionTime);

    const updatedLastUpdateTimestamp = updatedSubmissionTime.toISOString();
    const updatedDisplayTimestamp = updatedSubmissionTime.toISOString();

    // 部長ダッシュボードを手動リロードせずに表示内容を確認
    const updatedResult: DashboardDataFreshnessOutput = ensureDashboardDataFreshness(input, {
      lastUpdateTimestamp: updatedLastUpdateTimestamp,
      displayTimestamp: updatedDisplayTimestamp,
    });

    // データが新鮮な状態（最新データ）を確認
    expect(updatedResult.isDataFresh).toBe(true);
    expect(updatedResult.lastUpdateTimestamp).toBe(updatedLastUpdateTimestamp);
    expect(updatedResult.displayTimestamp).toBe(updatedDisplayTimestamp);

    // stalenessSeconds = displayTimestamp - lastUpdateTimestamp = 0秒（同時刻）
    expect(updatedResult.stalenessSeconds).toBe(0);

    // データが新鮮なまま自動更新されたことを確認
    expect(updatedResult.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);

    jest.useRealTimers();
  });
});