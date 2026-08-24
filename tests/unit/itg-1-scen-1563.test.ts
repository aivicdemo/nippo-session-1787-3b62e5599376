import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1563
  test('should throw ValidationError when aggregationEndDate is null', () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-08-19',
      aggregationEndDate: null as any,
      extractedIssues: [
        {
          keyword: 'デプロイエラー',
          occurrenceCount: 3,
          impactScore: 85,
        },
      ],
      teamId: 'team-001',
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/終了日/);
  });
});