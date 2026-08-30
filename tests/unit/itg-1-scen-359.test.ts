import { prepareDashboardData, type DashboardDataPrepareInput } from '../../src/logic/dashboard-presentation';

describe('prepareDashboardData', () => {
  // SCEN-359: [error] 対象日付が未来の日付であるときにエラーが投げられることを検証
  test('should throw error when targetDate is in the future', () => {
    const now = new Date('2026-08-20T10:00:00Z');
    const futureDate = new Date('2026-08-21T00:00:00Z');

    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: futureDate,
      requestingUserId: 'user-director-001',
      includeHistoricalTrend: false,
    };

    expect(() => prepareDashboardData(input)).toThrow(/対象日付は本日以前である必要があります/);
  });
});