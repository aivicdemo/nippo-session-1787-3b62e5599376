import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード更新機能 - データ鮮度確保ロジック', () => {
  // SCEN-1084: [edge] ダッシュボード更新機能 - ダッシュボード表示時刻がシステム時刻の1秒超時点で記録される
  test('システム時刻から1秒を超える時点でのダッシュボード更新時、最終更新時刻が正確に記録される', () => {
    // Arrange: モック時刻の初期値
    const initialSystemTime = new Date('2026-08-19T10:30:00.000Z');
    const updatedSystemTime = new Date('2026-08-19T10:30:01.500Z');

    // 最初のダッシュボード表示時刻（初期化時）
    const displayTimestampAtInit = new Date('2026-08-19T10:30:00.000Z').toISOString();

    // 1.5秒経過後のシステム時刻
    const expectedLastUpdateTimestamp = new Date('2026-08-19T10:30:01.500Z').toISOString();

    // データ遅延時間を計算（maxStalenessSeconds = 300秒がデフォルト）
    const maxStalenessSeconds = 300;
    const initialUpdateTime = new Date('2026-08-19T10:30:00.000Z');
    const currentTime = new Date('2026-08-19T10:30:01.500Z');
    const expectedStalenessSeconds = Math.floor(
      (currentTime.getTime() - initialUpdateTime.getTime()) / 1000
    );

    // Act: ダッシュボードデータ鮮度チェック入力を作成
    const input: DashboardDataFreshnessInput = {
      userId: 'user-dept-head-001',
      teamId: 'team-dev-001',
      reportDate: '2026-08-19',
      maxStalenessSeconds,
    };

    // 初期表示時刻をシミュレート
    const lastUpdateTimestamp = displayTimestampAtInit;

    // ダッシュボード更新時刻をシミュレート（1.5秒経過後）
    const displayTimestampAfterUpdate = expectedLastUpdateTimestamp;

    // ensureDashboardDataFreshness 関数を呼び出し
    const result: DashboardDataFreshnessOutput = ensureDashboardDataFreshness(input);

    // Assert: 結果検証
    // 1. データが最新状態であることを確認
    expect(result.isDataFresh).toBe(true);

    // 2. 最終更新時刻が記録されていることを確認（ISO 8601形式）
    expect(result.lastUpdateTimestamp).toBeDefined();
    const lastUpdateTime = new Date(result.lastUpdateTimestamp);
    expect(lastUpdateTime.getTime()).toBeGreaterThanOrEqual(
      new Date(displayTimestampAtInit).getTime()
    );

    // 3. 表示時刻が最終更新時刻より後である、または同じであることを確認
    const displayTime = new Date(result.displayTimestamp);
    expect(displayTime.getTime()).toBeGreaterThanOrEqual(lastUpdateTime.getTime());

    // 4. データ遅延時間が記録されており、許容範囲以内であることを確認
    expect(result.stalenessSeconds).toBeDefined();
    expect(result.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);
    expect(result.stalenessSeconds).toBeGreaterThanOrEqual(1);

    // 5. 更新時刻が1秒を超える時点であることを確認（1.5秒は300秒以内）
    // 期待される遅延時間は約1.5秒
    expect(result.stalenessSeconds).toBeCloseTo(1.5, 0);

    // 6. displayTimestamp が実際に記録されていることを確認
    expect(result.displayTimestamp).toBeDefined();
    const displayTimeObj = new Date(result.displayTimestamp);
    // 表示時刻は更新検証時刻よりも後でなければならない
    expect(displayTimeObj.getTime()).toBeGreaterThan(
      new Date('2026-08-19T10:30:00.000Z').getTime()
    );

    // 7. 最終更新時刻が更新検証後の時刻を超えていないことを確認
    expect(lastUpdateTime.getTime()).toBeLessThanOrEqual(
      new Date('2026-08-19T10:30:01.500Z').getTime()
    );
  });
});