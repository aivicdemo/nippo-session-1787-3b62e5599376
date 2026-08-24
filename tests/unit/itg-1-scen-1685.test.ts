import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - エラーハンドリング', () => {
  test('SCEN-1685: 分析対象期間の終了日が null のとき分析を中止しエラーを返す', () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: null as any,
      extractedIssues: [
        {
          keyword: 'テスト失敗',
          occurrenceCount: 2,
          impactScore: 75,
        },
      ],
      teamId: 'team-001',
    };

    expect(() => {
      generateWeeklyAnalysisReport(input);
    }).toThrow(/終了日/);
  });
});