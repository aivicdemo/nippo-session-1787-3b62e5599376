import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Cache Fallback on TextAnalysisService Failure', () => {
  // SCEN-1893
  test('should display cached analysis results when TextAnalysisServiceAdapter extraction fails after 3 retries', async () => {
    const teamId = 'team-001';
    const reportId = 'report-2026-08-19-001';
    const requestUserId = 'user-engineer-001';
    const startDate = new Date('2026-08-12T00:00:00Z');
    const endDate = new Date('2026-08-19T23:59:59Z');

    const cachedAnalysisTimestamp = new Date('2026-08-19T14:30:00Z');
    const cachedKeywords = [
      {
        keywordId: 'keyword-001',
        keyword: 'database connection timeout',
        frequency: 5,
        rank: 1,
      },
      {
        keywordId: 'keyword-002',
        keyword: 'memory leak in background process',
        frequency: 3,
        rank: 2,
      },
      {
        keywordId: 'keyword-003',
        keyword: 'API response delay',
        frequency: 2,
        rank: 3,
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockCache = {
      get: jest.fn().mockReturnValue({
        keywords: cachedKeywords,
        totalKeywordCount: 10,
        extractedAt: cachedAnalysisTimestamp,
        analysisPeriodDays: 7,
        isCached: true,
      }),
      set: jest.fn(),
    };

    mockTextAnalysisServiceAdapter.extractKeywords.mockRejectedValueOnce(
      new Error('API connection failed')
    );
    mockTextAnalysisServiceAdapter.extractKeywords.mockRejectedValueOnce(
      new Error('API timeout')
    );
    mockTextAnalysisServiceAdapter.extractKeywords.mockRejectedValueOnce(
      new Error('Service unavailable')
    );

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      mockCache
    );

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    expect(mockCache.get).toHaveBeenCalledWith(
      expect.stringContaining(teamId)
    );

    expect(result).toEqual<RankedIssueKeywordList>({
      keywords: cachedKeywords,
      totalKeywordCount: 10,
      extractedAt: cachedAnalysisTimestamp,
      analysisperiodDays: 7,
    });

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[2].frequency).toBe(2);
    expect(result.keywords[2].rank).toBe(3);
  });
});