import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - TextAnalysisServiceAdapter failure handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2245: TextAnalysisServiceAdapterのassessImpactScoreが失敗したときエラーになる
  test('should handle assessImpactScore failure by catching exception, displaying error message, using cache, retrying 3 times, and sending admin alert', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-dept-head-001';

    // Mock TextAnalysisServiceAdapter that fails with network timeout
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システムダウン対応', 'DB接続エラー'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('Network timeout: API call failed after 30s')
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    // Mock cache adapter to return previous analysis results
    const cacheAdapter = {
      get: jest.fn().mockResolvedValue({
        keywords: [
          {
            keywordId: 'kw-001',
            keyword: 'システムダウン対応',
            frequency: 2,
            rank: 1,
          },
          {
            keywordId: 'kw-002',
            keyword: 'DB接続エラー',
            frequency: 1,
            rank: 2,
          },
        ],
        totalKeywordCount: 2,
        extractedAt: new Date('2024-01-14T10:00:00Z'),
        analysisPeriodDays: 7,
      }),
    };

    // Mock retry handler to track retry attempts
    const retryHandler = {
      attemptCount: 0,
      maxRetries: 3,
      retryIntervals: [3000, 10000, 30000],
      execute: jest
        .fn()
        .mockImplementation(async () => {
          retryHandler.attemptCount += 1;
          if (retryHandler.attemptCount <= retryHandler.maxRetries) {
            throw new Error(
              `Retry attempt ${retryHandler.attemptCount} failed: API unavailable`
            );
          }
          return null;
        }),
    };

    // Mock admin alert service
    const adminAlertService = {
      sendAlert: jest.fn().mockResolvedValue({
        alertId: 'alert-2024-0115-001',
        timestamp: new Date('2024-01-15T09:30:00Z'),
        severity: 'high',
        message:
          'TextAnalysisServiceAdapter assessImpactScore failed after 3 retries',
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    try {
      // Execute the function with failing adapter
      const result = await extractAndRankIssueKeywords(input, {
        textAnalysisAdapter: failingTextAnalysisAdapter,
        cacheAdapter,
        retryHandler,
        adminAlertService,
      });

      // Verify that the system catches the exception and returns cached result
      expect(result).toBeDefined();
      expect(result.keywords).toHaveLength(2);
      expect(result.keywords[0].keyword).toBe('システムダウン対応');
      expect(result.keywords[0].rank).toBe(1);
      expect(result.keywords[1].keyword).toBe('DB接続エラー');
      expect(result.keywords[1].rank).toBe(2);

      // Verify error message is set for UI display
      expect(result.errorMessage).toBe(
        '課題分析が一時的に利用できません。手動入力をご利用ください'
      );

      // Verify cache was called to retrieve previous analysis
      expect(cacheAdapter.get).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId,
          cacheType: 'issue_keywords_analysis',
        })
      );

      // Verify retry handler was executed 3 times
      expect(retryHandler.execute).toHaveBeenCalledTimes(3);
      expect(retryHandler.attemptCount).toBe(3);

      // Verify retry intervals were used
      retryHandler.retryIntervals.forEach((interval, index) => {
        expect(retryHandler.execute).toHaveBeenNthCalledWith(
          index + 1,
          expect.objectContaining({
            delayMs: interval,
            retryAttempt: index + 1,
          })
        );
      });

      // Verify admin alert was sent after all retries failed
      expect(adminAlertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'assessImpactScore_failure',
          reason: 'max_retries_exceeded',
          teamId,
          requestUserId,
        })
      );

      // Verify the alert contains expected data
      const alertCall = adminAlertService.sendAlert.mock.results[0].value;
      expect(alertCall.alertId).toBe('alert-2024-0115-001');
      expect(alertCall.severity).toBe('high');

      // Verify report submission is NOT interrupted
      expect(result.isReportSubmissionBlocked).toBe(false);

      // Verify user can proceed with manual keyword input
      expect(result.allowManualKeywordInput).toBe(true);
    } catch (error) {
      // Verify error is handled gracefully and does not propagate
      expect(error).toBeUndefined();
    }
  });
});