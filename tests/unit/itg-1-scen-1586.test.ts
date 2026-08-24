import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation - External Service Failure Handling', () => {
  // SCEN-1586: [error] 週次課題傾向レポート生成機能 - TextAnalysisServiceAdapter の assessImpactScore が失敗したときエラーになる
  test('should handle assessImpactScore failure with cache fallback and return 503 error response', async () => {
    // Mock TextAnalysisServiceAdapter with assessImpactScore that fails after 3 retries
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害', 'データベース接続エラー'],
        frequencies: [5, 3],
      }),
      assessImpactScore: jest
        .fn()
        .mockRejectedValue(new Error('API timeout')),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'high',
      }),
    };

    // Mock keyword cache that returns previous analysis result
    const mockCacheKeywordDictionary = {
      'システム障害': {
        impactScore: 85,
        frequency: 5,
        lastUpdated: '2024-01-08T00:00:00Z',
      },
      'データベース接続エラー': {
        impactScore: 72,
        frequency: 3,
        lastUpdated: '2024-01-08T00:00:00Z',
      },
    };

    // Mock logger to capture error logs
    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    // Mock dashboard notification system
    const mockDashboardNotifier = {
      displayMessage: jest.fn().mockResolvedValue(true),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'システム障害',
          occurrenceCount: 5,
          impactScore: null, // Will fail to assess
        },
        {
          issueKeyword: 'データベース接続エラー',
          occurrenceCount: 3,
          impactScore: null, // Will fail to assess
        },
      ],
      teamId: 'team-001',
    };

    try {
      const result = await generateWeeklyAnalysisReport(
        input,
        mockTextAnalysisServiceAdapter,
        mockCacheKeywordDictionary,
        mockLogger,
        mockDashboardNotifier,
      );

      // Verify error response is returned
      expect(result.errorCode).toBe('ANALYSIS_UNAVAILABLE');
      expect(result.message).toBe(
        '課題分析が一時的に利用できません',
      );
      expect(result.httpStatusCode).toBe(503);

      // Verify error was logged with retry exhaustion message
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('assessImpactScore failed after 3 retries'),
      );

      // Verify dashboard notification was sent
      expect(mockDashboardNotifier.displayMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '課題分析が一時的に利用できません。手動入力をご利用ください',
          type: 'error',
        }),
      );

      // Verify cache fallback was used
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Using cached analysis results'),
      );

      // Verify assessImpactScore was retried 3 times
      expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(
        6, // 2 keywords × 3 retries
      );
    } catch (error) {
      // Should not throw; should return error response
      fail(
        `generateWeeklyAnalysisReport should not throw error, but got: ${error}`,
      );
    }
  });
});