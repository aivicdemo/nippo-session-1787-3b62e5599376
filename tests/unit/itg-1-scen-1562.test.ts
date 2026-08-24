import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1562: [error] 週次課題傾向レポート生成機能 - 集計期間の開始日が null のときエラーになる
  test('集計期間の開始日が null のときエラーが発生する', () => {
    const invalidInput = {
      aggregationStartDate: null as unknown as string,
      aggregationEndDate: '2026-08-25',
      extractedIssues: [
        {
          issueKeyword: 'テストキーワード',
          occurrenceCount: 3,
          impactScore: 75,
        },
      ],
      teamId: 'team-001',
    };

    expect(() => generateWeeklyAnalysisReport(invalidInput as any)).toThrow(
      /startDate|開始日/
    );
  });
});