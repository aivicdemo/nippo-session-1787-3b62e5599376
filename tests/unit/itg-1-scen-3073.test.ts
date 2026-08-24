import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - OpenAI API Failure with Cache Fallback', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-3073
  test('should return cached previous analysis results when TextAnalysisServiceAdapter fails with HTTP 500 after 3 retries', async () => {
    const teamId = 'team-user-a-001';
    const startDate = new Date('2026-01-13T00:00:00Z');
    const endDate = new Date('2026-01-13T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-a-001';

    const cachedPreviousResult = {
      keywordId_1: 'api-linkage-001',
      keyword_1: 'API連携',
      frequency_1: 3,
      keywordId_2: 'latency-improvement-001',
      keyword_2: 'レイテンシ改善',
      frequency_2: 2,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('HTTP 500: Internal Server Error')
      ),
      assessImpactScore: jest.fn().mockResolvedValue(85),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockCacheService = {
      getLastAnalysisResult: jest
        .fn()
        .mockResolvedValue(cachedPreviousResult),
      setAnalysisResult: jest.fn().mockResolvedValue(undefined),
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result = await extractAndRankIssueKeywords(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      cacheService: mockCacheService,
      maxRetries: 3,
      retryIntervals: [3000, 10000, 30000],
    });

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockCacheService.getLastAnalysisResult).toHaveBeenCalledWith(
      teamId,
      requestUserId
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual(
      expect.objectContaining({
        keyword: 'API連携',
        frequency: 3,
        rank: 1,
      })
    );
    expect(result.keywords[1]).toEqual(
      expect.objectContaining({
        keyword: 'レイテンシ改善',
        frequency: 2,
        rank: 2,
      })
    );

    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.fallbackMode).toBe(true);
    expect(result.fallbackMessage).toBe(
      '課題分析が一時的に利用できません。手動入力をご利用ください'
    );
  });
});