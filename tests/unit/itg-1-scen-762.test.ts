import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - TextAnalysisServiceAdapter Failure Fallback', () => {
  // SCEN-762
  test('should execute cache fallback when TextAnalysisServiceAdapter extractKeywords fails after max retries', async () => {
    // Arrange: Mock TextAnalysisServiceAdapter that throws on every call
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('Network timeout: Unable to reach AI service');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Mock cache with pre-registered past analysis results
    const mockCacheKeywordDictionary = [
      {
        keywordId: 'kwrd_001',
        keyword: '納期遅延',
        frequency: 3,
        lastUpdated: new Date('2024-12-20T10:00:00Z'),
      },
      {
        keywordId: 'kwrd_002',
        keyword: 'リソース不足',
        frequency: 2,
        lastUpdated: new Date('2024-12-20T09:30:00Z'),
      },
    ];

    const mockCacheProvider = {
      getKeywordDictionary: jest.fn().mockReturnValue(mockCacheKeywordDictionary),
      setKeywordDictionary: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    // Input parameters matching business scenario
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team_dev_001',
      startDate: new Date('2024-12-14T00:00:00Z'), // 7 days before end date
      endDate: new Date('2024-12-20T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user_pm_001',
    };

    // Act: Call the function with mocked adapters
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockCacheProvider
    );

    // Assert: Verify retry attempts were made
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // Assert: Verify cache fallback was triggered
    expect(mockCacheProvider.getKeywordDictionary).toHaveBeenCalledWith('team_dev_001');

    // Assert: Verify response contains cache fallback data with correct ranking
    expect(result).toEqual({
      keywords: [
        {
          keywordId: 'kwrd_001',
          keyword: '納期遅延',
          frequency: 3,
          rank: 1,
        },
        {
          keywordId: 'kwrd_002',
          keyword: 'リソース不足',
          frequency: 2,
          rank: 2,
        },
      ],
      totalKeywordCount: 2,
      extractedAt: expect.any(Date),
      analysisperiodDays: 7,
    });

    // Assert: Verify the result indicates fallback status
    expect(result).toHaveProperty('keywords');
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.analysisperiodDays).toBe(7);

    // Assert: Verify keywords are ranked by frequency in descending order
    expect(result.keywords[0].rank).toBeLessThan(result.keywords[1].rank);
  });
});