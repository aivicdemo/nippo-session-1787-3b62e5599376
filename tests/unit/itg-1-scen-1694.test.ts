import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - 分析対象部門IDが空文字のとき', () => {
  test('SCEN-1694: 分析対象部門IDが空文字のとき分析を中止しエラーを返す', () => {
    const invalidInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'テスト失敗',
          occurrenceCount: 3,
          impactScore: 75,
        },
      ],
      teamId: '',
    };

    expect(() => {
      generateWeeklyAnalysisReport(invalidInput);
    }).toThrow(/分析対象部門ID/);
  });
});