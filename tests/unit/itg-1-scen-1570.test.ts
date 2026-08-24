import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1570: [error] 週次課題傾向レポート生成機能 - 推奨対策データが null のときエラーになる
  test('推奨対策データがnullの場合、エラーメッセージを含む例外を返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続タイムアウト', 'メモリリーク'],
        frequencies: [5, 3],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 85,
        recommendedAction: null,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const weeklyAnalysisReportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'データベース接続タイムアウト',
          occurrenceCount: 5,
          impactScore: 85,
        },
        {
          issueKeyword: 'メモリリーク',
          occurrenceCount: 3,
          impactScore: 72,
        },
      ],
      teamId: 'team-001',
    };

    expect(() =>
      generateWeeklyAnalysisReport(
        weeklyAnalysisReportInput,
        mockTextAnalysisServiceAdapter as any
      )
    ).toThrow(/推奨対策データ/);
  });
});