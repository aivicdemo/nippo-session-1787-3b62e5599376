import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import { type DashboardDataPrepareInput } from '../../src/logic/dashboard-presentation';

describe('Dashboard Presentation Logic', () => {
  // SCEN-385
  test('should throw error when refreshThresholdSeconds is 0 or less', () => {
    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: new Date('2024-01-15T00:00:00Z'),
      requestingUserId: 'manager-001',
      includeHistoricalTrend: false,
    };

    // Note: refreshThresholdSeconds is being set to 0, which violates the constraint
    // The function should validate this and throw an error
    expect(() => prepareDashboardData(input, 0)).toThrow(/更新間隔の設定が無効です/);
  });
});