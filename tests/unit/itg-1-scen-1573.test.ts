import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1573
  test('集計期間が不正な日付形式のときエラーになる', () => {
    const invalidInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-13-45',
      aggregationEndDate: '2026/13/45',
      extractedIssues: [],
      teamId: 'team-001',
    };

    expect(() => generateWeeklyAnalysisReport(invalidInput)).toThrow(/日付形式/);
  });
});