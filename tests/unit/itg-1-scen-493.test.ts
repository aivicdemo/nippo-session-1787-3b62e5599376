import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - TextAnalysisServiceAdapter Failure Handling', () => {
  let mockTextAnalysisServiceAdapter: any;
  let mockNotificationServiceAdapter: any;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;
  let retryLogEntries: Array<{ timestamp: Date; attempt: number; error: string }>;

  beforeEach(() => {
    retryLogEntries = [];
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 3 },
          { keyword: 'タイムアウト', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('TextAnalysisServiceAdapter.assessImpactScore API call failed with status 503')
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'delivered' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: 0, failed: 1, pending: 9 }),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-493
  test('should handle TextAnalysisServiceAdapter.assessImpactScore failure with retry logic and fallback to cache', async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-alpha-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    let attemptCount = 0;
    let lastRetryTimestamp: Date | null = null;

    const assessImpactScoreWithRetry = jest.fn(async (keyword: string) => {
      attemptCount++;
      const now = new Date();
      
      if (attemptCount === 1) {
        await new Promise(resolve => setTimeout(resolve, 3));
        throw new Error('TextAnalysisServiceAdapter.assessImpactScore API timeout');
      }
      if (attemptCount === 2) {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('TextAnalysisServiceAdapter.assessImpactScore invalid response format');
      }
      if (attemptCount === 3) {
        await new Promise(resolve => setTimeout(resolve, 30));
        throw new Error('TextAnalysisServiceAdapter.assessImpactScore connection refused');
      }
      
      lastRetryTimestamp = now;
      return { impactScore: 0 };
    });

    mockTextAnalysisServiceAdapter.assessImpactScore = assessImpactScoreWithRetry;

    const cachedPreviousAnalysisResult: RankedIssueKeywordList = {
      keywords: [
        {
          keywordId: 'kw-db-001',
          keyword: 'データベース接続エラー',
          frequency: 2,
          rank: 1,
        },
        {
          keywordId: 'kw-timeout-001',
          keyword: 'タイムアウト',
          frequency: 1,
          rank: 2,
        },
      ],
      totalKeywordCount: 2,
      extractedAt: new Date('2024-01-13T10:30:00Z'),
      analysisperiodDays: 7,
    };

    let result: RankedIssueKeywordList | { error: string; cachedResult?: RankedIssueKeywordList; retryAttempts: number } | undefined;
    let errorOccurred = false;
    const adminAuditLog: Array<{ timestamp: Date; eventType: string; detail: string }> = [];

    try {
      result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter,
        mockNotificationServiceAdapter
      );
    } catch (error: any) {
      errorOccurred = true;
      
      adminAuditLog.push({
        timestamp: new Date(),
        eventType: 'EXTERNAL_SERVICE_FAILURE',
        detail: `TextAnalysisServiceAdapter.assessImpactScore failed after 3 retry attempts: ${error.message}`,
      });

      result = {
        error: 'TextAnalysisServiceAdapter.assessImpactScore failure',
        cachedResult: cachedPreviousAnalysisResult,
        retryAttempts: 3,
      };
    }

    expect(errorOccurred).toBe(true);
    expect(assessImpactScoreWithRetry).toHaveBeenCalledTimes(3);
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('cachedResult');
    expect((result as any).cachedResult?.keywords).toEqual(cachedPreviousAnalysisResult.keywords);
    expect((result as any).retryAttempts).toBe(3);
    
    expect(adminAuditLog).toHaveLength(1);
    expect(adminAuditLog[0].eventType).toBe('EXTERNAL_SERVICE_FAILURE');
    expect(adminAuditLog[0].detail).toMatch(/TextAnalysisServiceAdapter\.assessImpactScore/);
    expect(adminAuditLog[0].detail).toMatch(/3 retry attempts/);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('TextAnalysisServiceAdapter.assessImpactScore')
    );
  });
});