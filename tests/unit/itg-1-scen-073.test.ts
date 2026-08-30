import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { aggregateReportsByPeriod } from '../../src/logic/report-data-aggregation';

describe('Report Data Aggregation - aggregateReportsByPeriod', () => {
  // SCEN-073: [error] 指定期間内に日報データが存在しない場合、NoReportDataFoundErrorが発生する
  test('should throw NoReportDataFoundError when no report data exists in the specified period', async () => {
    const startDate = new Date('2026-08-01T00:00:00Z');
    const endDate = new Date('2026-08-05T23:59:59Z');
    const periodType = 'daily';
    const targetTeamIds = undefined;
    const includeArchivedReports = false;

    const request = {
      periodStartDate: startDate,
      periodEndDate: endDate,
      targetTeamIds: targetTeamIds,
      includeArchivedReports: includeArchivedReports,
    };

    await expect(
      aggregateReportsByPeriod(
        startDate,
        endDate,
        periodType,
        targetTeamIds,
        includeArchivedReports
      )
    ).rejects.toThrow(/日報データが見つかりません/);
  });
});