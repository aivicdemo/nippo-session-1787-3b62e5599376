import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-553: [edge] 課題キーワード自動抽出・優先度判定機能 - 同じ影響度スコアを持つ複数の課題が発生頻度の降順で順序付けられる
  test('should rank keywords with identical impact scores by descending occurrence frequency', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'Issue A', frequency: 5 },
          { keyword: 'Issue B', frequency: 3 },
          { keyword: 'Issue C', frequency: 8 },
        ],
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        return Promise.resolve(65);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('Issue C');
    expect(result.keywords[0].frequency).toBe(8);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('Issue A');
    expect(result.keywords[1].frequency).toBe(5);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('Issue B');
    expect(result.keywords[2].frequency).toBe(3);
    expect(result.keywords[2].rank).toBe(3);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toEqual(expect.any(Date));
  });
});