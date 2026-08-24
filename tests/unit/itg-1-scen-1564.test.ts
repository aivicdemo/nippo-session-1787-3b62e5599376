import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1564
  test('集計期間の開始日が空文字列のときエラーになる', () => {
    const invalidInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '',
      aggregationEndDate: '2024-01-07',
      extractedIssues: [
        {
          issueKeyword: 'デプロイ失敗',
          occurrenceCount: 2,
          impactScore: 85,
        },
      ],
      teamId: 'team-001',
    };

    expect(() => generateWeeklyAnalysisReport(invalidInput)).toThrow(/集計期間の開始日/);
  });
});