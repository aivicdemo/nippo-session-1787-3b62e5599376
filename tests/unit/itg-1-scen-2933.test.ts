import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - TextAnalysisServiceAdapter Timeout Handling', () => {
  // SCEN-2933
  test('should return cached previous analysis results when extractKeywords times out after 30 seconds', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-dept-head-001';

    // Mock TextAnalysisServiceAdapter that times out (delay > 30 seconds)
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async () => {
        // Simulate timeout by returning a rejected promise after delay
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('API request timeout: exceeded 30 seconds'));
          }, 31000);
        });
      }),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 0,
      })),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: 'low',
      })),
    };

    // Cache repository mock that returns previous analysis results
    const mockCacheRepository = {
      getPreviousKeywordAnalysis: jest.fn(async () => ({
        keywords: [
          {
            keywordId: 'kw-db-conn',
            keyword: 'データベース接続',
            frequency: 3,
            rank: 1,
          },
          {
            keywordId: 'kw-auth-err',
            keyword: '認証エラー',
            frequency: 2,
            rank: 2,
          },
        ],
        totalKeywordCount: 5,
        extractedAt: new Date('2024-01-07T09:00:00Z'),
        analysisPeriodDays: 7,
        sourceFromCache: true,
        cacheNotice:
          '課題分析が一時的に利用できません。手動入力をご利用ください',
      })),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      mockCacheRepository
    );

    // Assertions
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: 'kw-db-conn',
      keyword: 'データベース接続',
      frequency: 3,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: 'kw-auth-err',
      keyword: '認証エラー',
      frequency: 2,
      rank: 2,
    });
    expect(result.totalKeywordCount).toBe(5);
    expect(result.extractedAt).toEqual(new Date('2024-01-07T09:00:00Z'));
    expect(result.analysisperiodDays).toBe(7);

    // Verify that cache was accessed after timeout
    expect(mockCacheRepository.getPreviousKeywordAnalysis).toHaveBeenCalledWith(
      teamId
    );

    // Verify that result includes cache notice for UI display
    expect(result).toHaveProperty('cacheNotice');
    expect(result.cacheNotice).toBe(
      '課題分析が一時的に利用できません。手動入力をご利用ください'
    );

    // Verify that sourceFromCache flag is set to true
    expect(result).toHaveProperty('sourceFromCache');
    expect(result.sourceFromCache).toBe(true);
  });
});