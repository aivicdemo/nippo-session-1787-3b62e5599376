import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Data Freshness', () => {
  // SCEN-1042
  test('should throw error when teamId is null during dashboard data freshness check', async () => {
    const userId = 'user-001';
    const teamId = null as any;
    const reportDate = '2024-01-15';
    const maxStalenessSeconds = 300;

    expect(() =>
      ensureDashboardDataFreshness({
        userId,
        teamId,
        reportDate,
        maxStalenessSeconds,
      })
    ).toThrow(/チームID/);
  });
});