import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1682: [error] 週次課題傾向分析レポート生成 - データ品質スコアが負数のとき分析を中止し品質不足警告を返す
  test('should stop analysis and return quality_insufficient warning when data quality score is negative', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 3 },
          { keyword: 'メモリリーク', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const testInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'データベース接続エラー',
          occurrenceCount: 3,
          impactScore: 85,
        },
        {
          issueKeyword: 'メモリリーク',
          occurrenceCount: 2,
          impactScore: 70,
        },
      ],
      teamId: 'team-123',
    };

    let thrownError: any;
    try {
      await generateWeeklyAnalysisReport(
        testInput,
        mockTextAnalysisServiceAdapter
      );
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.statusCode).toBe(400);
    expect(thrownError.message).toMatch(/データ品質スコアが無効です/);
    expect(thrownError.warning).toBeDefined();
    expect(thrownError.warning.quality_insufficient).toBe(true);
    expect(thrownError.detail).toBeDefined();
    expect(thrownError.detail.invalid_score).toBe(-5);
  });
});