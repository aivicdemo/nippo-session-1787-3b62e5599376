import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis: extractWeeklyReportData', () => {
  // SCEN-1622
  test('should return error when no prior week report data exists', () => {
    const emptyReports: any[] = [];
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-001';

    const input = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
      reports: emptyReports,
    };

    expect(() => {
      extractWeeklyReportData(input);
    }).toThrow(/日報データ/);
  });
});