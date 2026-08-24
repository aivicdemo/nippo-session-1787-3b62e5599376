import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - extractAndRankIssueKeywords', () => {
  // SCEN-491
  test('should return cached keywords when TextAnalysisServiceAdapter.extractKeywords fails after max retries', async () => {
    // Setup: Create mock TextAnalysisServiceAdapter that fails with TimeoutError
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(new Error('TimeoutError')),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Setup: Pre-register cached keyword data in the keyword dictionary
    // Previous analysis results: keyword "遅延" (delay) with frequency 3, "品質問題" (quality issue) with frequency 2
    const cachedKeywordDictionary = [
      {
        keywordId: 'kw_001',
        keyword: '遅延',
        frequency: 3,
        lastAnalyzedAt: new Date('2024-01-14T10:00:00Z'),
      },
      {
        keywordId: 'kw_002',
        keyword: '品質問題',
        frequency: 2,
        lastAnalyzedAt: new Date('2024-01-14T10:00:00Z'),
      },
    ];

    // Setup: Prepare input with new report text
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team_001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user_pm_001',
    };

    // Execute: Call extractAndRankIssueKeywords with mock adapter that fails
    // The function should retry 3 times (3s, 10s, 30s intervals) and then fall back to cache
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      cachedKeywordDictionary,
    );

    // Verify: extractKeywords was called and failed
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();

    // Verify: Result is the cached keywords sorted by frequency descending
    expect(result).toEqual<RankedIssueKeywordList>({
      keywords: [
        {
          keywordId: 'kw_001',
          keyword: '遅延',
          frequency: 3,
          rank: 1,
        },
        {
          keywordId: 'kw_002',
          keyword: '品質問題',
          frequency: 2,
          rank: 2,
        },
      ],
      totalKeywordCount: 2,
      extractedAt: expect.any(Date),
      analysisperiodDays: 1,
    });

    // Verify: Fallback status indicates cache usage
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[1].frequency).toBe(2);
  });
});