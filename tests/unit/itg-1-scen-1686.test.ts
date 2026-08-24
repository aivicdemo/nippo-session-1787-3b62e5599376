import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1686
  test('should return validation error when analysis start date is after end date', () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-01-15',
      aggregationEndDate: '2026-01-10',
      extractedIssues: [],
      teamId: 'team-001'
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/分析開始日は終了日以前である必要があります/);
  });
});