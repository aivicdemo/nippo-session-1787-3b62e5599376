import { prepareDashboardData } from '../../src/logic/dashboard-presentation';

describe('Dashboard Presentation', () => {
  // SCEN-308
  test('should throw error when team size is zero or negative', () => {
    const dashboardInput = {
      teamId: 'team-001',
      targetDate: new Date('2024-01-15T00:00:00Z'),
      requestingUserId: 'user-manager-001',
      includeHistoricalTrend: false,
    };

    const teamSizeZero = 0;

    expect(() =>
      prepareDashboardData(dashboardInput, teamSizeZero)
    ).toThrow(/チーム人数/);
  });
});