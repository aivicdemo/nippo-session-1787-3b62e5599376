import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Edge Case: Non-Integer Frequency Rounding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2298
  test('should round non-integer keyword frequency to integer value in ranking results', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'サーバーダウン',
            frequency: 7.5,
            confidence: 0.95,
          },
          {
            keyword: 'ネットワーク障害',
            frequency: 5.2,
            confidence: 0.87,
          },
          {
            keyword: 'リソース不足',
            frequency: 3.8,
            confidence: 0.92,
          },
        ],
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(3);

    const serverDownKeyword = result.keywords.find(
      (kw) => kw.keyword === 'サーバーダウン'
    );
    expect(serverDownKeyword).toBeDefined();
    expect(typeof serverDownKeyword!.frequency).toBe('number');
    expect(Number.isInteger(serverDownKeyword!.frequency)).toBe(true);
    expect([7, 8]).toContain(serverDownKeyword!.frequency);

    const networkIssueKeyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワーク障害'
    );
    expect(networkIssueKeyword).toBeDefined();
    expect(typeof networkIssueKeyword!.frequency).toBe('number');
    expect(Number.isInteger(networkIssueKeyword!.frequency)).toBe(true);
    expect([5, 6]).toContain(networkIssueKeyword!.frequency);

    const resourceKeyword = result.keywords.find(
      (kw) => kw.keyword === 'リソース不足'
    );
    expect(resourceKeyword).toBeDefined();
    expect(typeof resourceKeyword!.frequency).toBe('number');
    expect(Number.isInteger(resourceKeyword!.frequency)).toBe(true);
    expect([3, 4]).toContain(resourceKeyword!.frequency);

    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].rank).toBe(3);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith({
      teamId: 'team-001',
      startDate: input.startDate,
      endDate: input.endDate,
    });
  });
});