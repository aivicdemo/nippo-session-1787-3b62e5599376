import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1566
  test('課題ランキングデータが null のときエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keyword: 'デプロイエラー',
          occurrenceCount: 3,
          impactScore: 85,
        },
        {
          keyword: 'パフォーマンス低下',
          occurrenceCount: 2,
          impactScore: 70,
        },
      ],
      teamId: 'team-001',
    };

    expect(() =>
      generateWeeklyAnalysisReport(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/課題ランキング/);
  });
});