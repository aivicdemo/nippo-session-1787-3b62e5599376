import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-1008: [normal] ダッシュボード表示データ更新機能 - ダッシュボード更新時に表示時刻が現在時刻で記録される
  test('ダッシュボード更新時に表示時刻が現在時刻で正確に記録される', () => {
    // 初期設定：T1時点のシステム現在時刻
    const initialTimestamp = new Date('2026-08-19T10:30:45.123Z');
    const userId = 'user-manager-001';
    const teamId = 'team-dev-001';
    const reportDate = '2026-08-19';
    const maxStalenessSeconds = 300;

    // 入力データの準備
    const input: DashboardDataFreshnessInput = {
      userId,
      teamId,
      reportDate,
      maxStalenessSeconds,
    };

    // モック時刻管理：T1時点で初回呼び出し
    const mockGetCurrentTime = jest.fn(() => initialTimestamp);

    // T1時点でのダッシュボード初期表示
    const initialResult = ensureDashboardDataFreshness(input, mockGetCurrentTime);

    // T1時点の表示時刻を記録
    const t1DisplayTimestamp = new Date(initialResult.displayTimestamp);
    expect(t1DisplayTimestamp.toISOString()).toBe('2026-08-19T10:30:45.123Z');

    // 5秒以上経過させてT2時点での更新を模擬
    const updatedTimestamp = new Date('2026-08-19T10:30:50.456Z');
    const mockGetCurrentTimeUpdated = jest.fn(() => updatedTimestamp);

    // T2時点でのダッシュボード更新
    const updatedResult = ensureDashboardDataFreshness(input, mockGetCurrentTimeUpdated);

    // T2時点の表示時刻を記録
    const t2DisplayTimestamp = new Date(updatedResult.displayTimestamp);
    expect(t2DisplayTimestamp.toISOString()).toBe('2026-08-19T10:30:50.456Z');

    // T1とT2の差分が5秒以上であることを確認
    const timeDiffMs = t2DisplayTimestamp.getTime() - t1DisplayTimestamp.getTime();
    const timeDiffSeconds = timeDiffMs / 1000;
    expect(timeDiffSeconds).toBeGreaterThanOrEqual(5);

    // T2時点のlastUpdateTimestampがT2と一致することを確認
    const lastUpdateTimestamp = new Date(updatedResult.lastUpdateTimestamp);
    expect(lastUpdateTimestamp.toISOString()).toBe('2026-08-19T10:30:50.456Z');

    // データが新鮮な状態（stalenessSeconds < maxStalenessSeconds）であることを確認
    expect(updatedResult.stalenessSeconds).toBeLessThan(maxStalenessSeconds);

    // displayTimestampとlastUpdateTimestampが一致することを確認
    expect(updatedResult.displayTimestamp).toBe(updatedResult.lastUpdateTimestamp);

    // isDataFreshがtrueであることを確認（データが最新状態）
    expect(updatedResult.isDataFresh).toBe(true);
  });
});