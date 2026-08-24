import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('weekly issue analysis', () => {
  // SCEN-1450
  test('should throw error when aggregation end date is null', () => {
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = null as any;
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-001';

    const input = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    expect(() => extractWeeklyReportData(input)).toThrow(/終了日/);
  });
});