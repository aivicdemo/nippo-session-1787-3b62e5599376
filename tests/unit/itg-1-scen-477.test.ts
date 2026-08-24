import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - 出現頻度と影響度スコアから優先度スコアが計算され課題がランク付けされる', () => {
  // SCEN-477
  test('出現頻度と影響度スコアから優先度スコアが計算され課題がランク付けされること', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'サーバダウン', frequency: 5 },
          { keyword: '納期遅延', frequency: 3 },
          { keyword: 'リソース不足', frequency: 2 }
        ]
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce({ keyword: 'サーバダウン', impactScore: 85 })
        .mockResolvedValueOnce({ keyword: '納期遅延', impactScore: 60 })
        .mockResolvedValueOnce({ keyword: 'リソース不足', impactScore: 40 }),
      classifyIssueSeverity: jest.fn()
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'サーバダウン',
      frequency: 5,
      rank: 1
    });
    expect(result.keywords[0].priorityScore).toBeCloseTo(100, 1);

    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: '納期遅延',
      frequency: 3,
      rank: 2
    });
    expect(result.keywords[1].priorityScore).toBeCloseTo(42, 1);

    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'リソース不足',
      frequency: 2,
      rank: 3
    });
    expect(result.keywords[2].priorityScore).toBeCloseTo(19, 1);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith({
      teamId: 'team-001',
      startDate: input.startDate,
      endDate: input.endDate
    });

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);
  });
});