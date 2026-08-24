import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis: extractWeeklyReportData', () => {
  // SCEN-1628
  test('should return error when analysis end date is not specified', () => {
    const weekStartDate = new Date('2026-01-05T00:00:00Z');
    const weekEndDate = null;
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-001';

    const request = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    expect(() =>
      extractWeeklyReportData(request)
    ).toThrow(/終了日/);
  });
});