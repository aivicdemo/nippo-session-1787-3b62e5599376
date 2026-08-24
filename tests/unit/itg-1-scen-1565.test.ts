import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1565
  test('集計期間の終了日が空文字列のときValidationErrorがスローされる', () => {
    const invalidInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-01-01',
      aggregationEndDate: '',
      extractedIssues: [
        {
          keyword: 'テスト失敗',
          occurrenceCount: 3,
          impactScore: 75,
        },
      ],
      teamId: 'team-001',
    };

    expect(() => {
      generateWeeklyAnalysisReport(invalidInput);
    }).toThrow(/集計期間の終了日/);
  });
});