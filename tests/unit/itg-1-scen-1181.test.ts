import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1181: TextAnalysisServiceAdapter.extractKeywords が null を返すとき処理がエラーになる
  test('should handle null response from TextAnalysisServiceAdapter.extractKeywords with fallback and retry logic', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockChallengeKeywordCache = {
      getCachedKeywords: jest.fn().mockResolvedValue([
        { keywordId: 'cache-1', keyword: 'キャッシュされた課題1', frequency: 2 },
        { keywordId: 'cache-2', keyword: 'キャッシュされた課題2', frequency: 1 },
      ]),
      setCachedKeywords: jest.fn().mockResolvedValue(undefined),
    };

    const mockRetryLogic = {
      executeWithRetry: jest.fn(async (operation, retryConfig) => {
        const attempts = [];
        for (let i = 0; i < retryConfig.maxRetries; i++) {
          attempts.push(i);
          try {
            return await operation();
          } catch (error) {
            if (i === retryConfig.maxRetries - 1) throw error;
            await new Promise((resolve) =>
              setTimeout(resolve, retryConfig.intervals[i])
            );
          }
        }
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert
    try {
      const result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter,
        mockChallengeKeywordCache,
        mockRetryLogic
      );

      // Verify retry attempts were made with correct intervals
      expect(mockRetryLogic.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: 3,
          intervals: [3000, 10000, 30000],
        })
      );

      // Verify cache fallback was attempted
      expect(mockChallengeKeywordCache.getCachedKeywords).toHaveBeenCalledWith(
        'team-001'
      );

      // Verify result contains fallback data from cache
      expect(result).toEqual(
        expect.objectContaining({
          keywords: expect.arrayContaining([
            expect.objectContaining({
              keyword: 'キャッシュされた課題1',
              frequency: 2,
              rank: 1,
            }),
            expect.objectContaining({
              keyword: 'キャッシュされた課題2',
              frequency: 1,
              rank: 2,
            }),
          ]),
          totalKeywordCount: 2,
          extractedAt: expect.any(Date),
          analysisperiodDays: 7,
        })
      );

      // Verify that manual input fallback flag is set in result
      expect(result).toEqual(
        expect.objectContaining({
          isManualInputFallbackActive: true,
          errorMessage:
            '課題分析が一時的に利用できません。手動入力をご利用ください',
        })
      );

      // Verify that report sending is not blocked
      expect(result.allowReportSubmission).toBe(true);
    } catch (error) {
      // Should not throw - should use fallback instead
      fail('extractAndRankIssueKeywords should not throw when adapter returns null');
    }
  });
});