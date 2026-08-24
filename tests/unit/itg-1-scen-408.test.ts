import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示', () => {
  // SCEN-408: [normal] 部長ダッシュボード表示機能 - 報告提出状況が更新されている場合、ダッシュボード表示の内容が最新状態に反映される
  test('should reflect updated submission status when dashboard data has been refreshed', () => {
    const currentTimestamp = new Date('2024-01-15T09:05:00Z').toISOString();
    const displayTimestamp = new Date('2024-01-15T09:05:30Z').toISOString();
    const lastUpdateTimestamp = new Date('2024-01-15T09:04:00Z').toISOString();
    const maxStalenessSeconds = 300;
    const stalenessSeconds = 30;

    const input = {
      userId: 'user-manager-001',
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: maxStalenessSeconds,
    };

    const currentTime = new Date(currentTimestamp);
    const lastUpdateTime = new Date(lastUpdateTimestamp);
    const actualStalenessSeconds =
      (currentTime.getTime() - lastUpdateTime.getTime()) / 1000;

    const result = ensureDashboardDataFreshness(input);

    expect(result).toEqual({
      isDataFresh: true,
      lastUpdateTimestamp: lastUpdateTimestamp,
      displayTimestamp: expect.any(String),
      stalenessSeconds: expect.any(Number),
    });

    expect(result.isDataFresh).toBe(true);
    expect(result.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);
    expect(result.stalenessSeconds).toBeGreaterThanOrEqual(0);

    const displayTime = new Date(result.displayTimestamp);
    expect(displayTime.getTime()).toBeGreaterThanOrEqual(
      new Date(lastUpdateTimestamp).getTime()
    );
  });
});