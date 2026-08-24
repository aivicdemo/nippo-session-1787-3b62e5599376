import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1053
  test('should return cached previous results when TextAnalysisServiceAdapter fails after 3 retries', async () => {
    const teamId = 'team-001';
    const requestUserId = 'user-123';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(new Error('API connection failed')),
    };

    const mockCachedKeywords = [
      {
        keywordId: 'kw-001',
        keyword: 'データベース接続エラー',
        frequency: 5,
        rank: 1,
      },
      {
        keywordId: 'kw-002',
        keyword: 'メモリリーク',
        frequency: 3,
        rank: 2,
      },
      {
        keywordId: 'kw-003',
        keyword: 'タイムアウト',
        frequency: 2,
        rank: 3,
      },
    ];

    const mockCache = {
      get: jest.fn().mockReturnValue({
        keywords: mockCachedKeywords,
        totalKeywordCount: 10,
        extractedAt: new Date('2024-01-07T09:00:00Z'),
        analysisperiodDays: 7,
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const callCountBefore = mockTextAnalysisServiceAdapter.extractKeywords.mock.calls.length;

    let result: RankedIssueKeywordList | undefined;
    let errorMessage: string | undefined;

    try {
      result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter,
        mockCache
      );
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    const callCountAfter = mockTextAnalysisServiceAdapter.extractKeywords.mock.calls.length;
    const retryAttempts = callCountAfter - callCountBefore;

    expect(retryAttempts).toBe(3);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    expect(result).toBeDefined();
    expect(result?.keywords).toEqual(mockCachedKeywords);
    expect(result?.totalKeywordCount).toBe(10);
    expect(result?.extractedAt).toEqual(new Date('2024-01-07T09:00:00Z'));
    expect(result?.analysisperiodDays).toBe(7);
  });
});