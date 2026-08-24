import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1572
  test('should throw error when end date is before start date', () => {
    const aggregationStartDate = '2024-01-15';
    const aggregationEndDate = '2024-01-10';
    const extractedIssues = [
      {
        keyword: 'Database Connection',
        occurrenceCount: 3,
        impactScore: 85,
      },
    ];
    const teamId = 'team-001';

    const input = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues,
      teamId,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/終了日/);
  });
});