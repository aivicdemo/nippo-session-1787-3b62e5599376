import { aggregateReportsByPeriod } from '../../src/logic/report-data-aggregation';

describe('report-data-aggregation', () => {
  test('SCEN-566: throws NoReportDataFoundError when no reports exist in specified period', () => {
    const startDate = new Date('2025-01-01T00:00:00Z');
    const endDate = new Date('2025-01-31T23:59:59Z');
    const periodType = 'monthly' as const;
    const targetTeamIds = ['team-001'];
    const includeArchivedReports = false;

    const request = {
      startDate,
      endDate,
      periodType,
      targetTeamIds,
      includeArchivedReports,
    };

    expect(() => aggregateReportsByPeriod(request)).toThrow(/指定期間内に日報データが見つかりません/);
  });
});