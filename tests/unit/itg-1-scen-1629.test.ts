import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis: extractWeeklyReportData', () => {
  // SCEN-1629
  test('should reject and throw error when weekStartDate is after weekEndDate', () => {
    const invalidRequest = {
      weekStartDate: new Date('2026-01-15T00:00:00Z'),
      weekEndDate: new Date('2026-01-10T23:59:59Z'),
      requestedByUserId: 'user-001',
    };

    expect(() => extractWeeklyReportData(invalidRequest)).toThrow(/開始日は終了日以前/);
  });
});