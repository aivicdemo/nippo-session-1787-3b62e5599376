import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Extract and Rank Keywords', () => {
  // SCEN-2299: [edge] 課題発生頻度ランキング機能 - 同一頻度の複数の課題キーワードが並ぶ場合、ランク順序が安定している
  test('should maintain stable rank order for keywords with equal frequency across multiple executions', async () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keywordId: 'kw-001', keyword: 'キーワードA', frequency: 5 },
          { keywordId: 'kw-002', keyword: 'キーワードB', frequency: 5 },
          { keywordId: 'kw-003', keyword: 'キーワードC', frequency: 3 },
        ],
        totalCount: 13,
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // First execution to record initial order
    const firstResult: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Verify first result structure
    expect(firstResult.keywords).toHaveLength(3);
    expect(firstResult.totalKeywordCount).toBe(13);
    expect(firstResult.analysisperiodDays).toBe(31);
    expect(firstResult.extractedAt).toBeInstanceOf(Date);

    // Record the order of keywords with equal frequency (5)
    const firstExecutionOrder = firstResult.keywords
      .filter(kw => kw.frequency === 5)
      .map(kw => kw.keyword);

    expect(firstExecutionOrder).toHaveLength(2);
    expect(firstExecutionOrder).toEqual(['キーワードA', 'キーワードB']);

    // Verify rank assignment
    const firstResultRanks = firstResult.keywords.map(kw => ({
      keyword: kw.keyword,
      rank: kw.rank,
      frequency: kw.frequency,
    }));
    expect(firstResultRanks).toEqual([
      { keyword: 'キーワードA', rank: 1, frequency: 5 },
      { keyword: 'キーワードB', rank: 2, frequency: 5 },
      { keyword: 'キーワードC', rank: 3, frequency: 3 },
    ]);

    // Execute 4 additional times to verify stable ordering
    const executionResults: RankedIssueKeywordList[] = [];
    for (let i = 0; i < 4; i++) {
      const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisAdapter
      );
      executionResults.push(result);
    }

    // Verify that all executions maintain the same order for equal-frequency keywords
    executionResults.forEach((result, executionIndex) => {
      const currentExecutionOrder = result.keywords
        .filter(kw => kw.frequency === 5)
        .map(kw => kw.keyword);

      expect(currentExecutionOrder).toEqual(firstExecutionOrder);
      expect(result.keywords[0].keyword).toBe('キーワードA');
      expect(result.keywords[0].rank).toBe(1);
      expect(result.keywords[1].keyword).toBe('キーワードB');
      expect(result.keywords[1].rank).toBe(2);
      expect(result.keywords[2].keyword).toBe('キーワードC');
      expect(result.keywords[2].rank).toBe(3);
    });

    // Verify that keyword C (frequency 3) is always ranked lower than keywords A and B
    executionResults.forEach((result) => {
      const keywordCRank = result.keywords.find(kw => kw.keyword === 'キーワードC')?.rank;
      const keywordABMaxRank = Math.max(
        result.keywords.find(kw => kw.keyword === 'キーワードA')?.rank ?? 0,
        result.keywords.find(kw => kw.keyword === 'キーワードB')?.rank ?? 0
      );
      expect(keywordCRank).toBeGreaterThan(keywordABMaxRank);
    });
  });
});