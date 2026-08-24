import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('部長ダッシュボード表示機能 - 統合後の一意な課題リストが優先度スコアの降順で正確に表示される', () => {
  // SCEN-1400
  test('重複排除された課題リストが優先度スコア降順で表示される', () => {
    const input: DashboardDataFreshnessInput = {
      userId: 'manager-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const expectedLastUpdateTimestamp = '2024-01-15T09:00:00.000Z';
    const expectedDisplayTimestamp = '2024-01-15T09:05:00.000Z';
    const expectedStalenessSeconds = 300;

    const result: DashboardDataFreshnessOutput = ensureDashboardDataFreshness(input);

    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBe(expectedLastUpdateTimestamp);
    expect(result.displayTimestamp).toBe(expectedDisplayTimestamp);
    expect(result.stalenessSeconds).toBe(expectedStalenessSeconds);
  });
});