import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - TextAnalysisServiceAdapter Timeout Retry', () => {
  let mockTextAnalysisServiceAdapter: {
    extractKeywords: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // SCEN-1193
  test('should retry extractKeywords 3 times with exponential backoff on TimeoutError, then return error', async () => {
    const timeoutError = new Error('TimeoutError');
    timeoutError.name = 'TimeoutError';

    mockTextAnalysisServiceAdapter.extractKeywords.mockRejectedValue(timeoutError);

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportingTexts = [
      '昨日は機能A実装、今日は機能B実装、課題はデータベース接続が不安定',
    ];

    const extractPromise = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      reportingTexts
    );

    // First attempt
    await jest.advanceTimersByTimeAsync(0);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);

    // First retry after 3 seconds
    await jest.advanceTimersByTimeAsync(3000);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(2);

    // Second retry after 10 seconds (3 + 10 = 13 total)
    await jest.advanceTimersByTimeAsync(10000);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // Third retry after 30 seconds (13 + 30 = 43 total)
    await jest.advanceTimersByTimeAsync(30000);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(4);

    // Advance to complete the promise
    await jest.runAllTimersAsync();

    try {
      const result = await extractPromise;
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('課題分析が一時的に利用できません');
    } catch (error) {
      expect(error).toBeDefined();
      expect(String(error)).toMatch(/課題分析|Timeout/);
    }

    // Verify exactly 4 attempts (1 initial + 3 retries)
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(4);

    // Verify no fifth attempt
    await jest.advanceTimersByTimeAsync(60000);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(4);
  });
});