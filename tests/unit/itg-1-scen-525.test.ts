import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-525: [normal] 課題自動抽出・優先度判定機能 - 複数の抽出キーワードが存在する場合、チーム波及度スコアが高い順に課題が順序付けされる
  test('should rank extracted keywords by impact score in descending order', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue({
      keywords: [
        { keyword: 'キーワードA', frequency: 3 },
        { keyword: 'キーワードB', frequency: 5 },
        { keyword: 'キーワードC', frequency: 4 },
      ],
    });

    mockTextAnalysisServiceAdapter.assessImpactScore
      .mockResolvedValueOnce({ impactScore: 45 })
      .mockResolvedValueOnce({ impactScore: 78 })
      .mockResolvedValueOnce({ impactScore: 62 });

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keyword: 'キーワードB',
      frequency: 5,
      rank: 1,
      impactScore: 78,
    });
    expect(result.keywords[1]).toEqual({
      keyword: 'キーワードC',
      frequency: 4,
      rank: 2,
      impactScore: 62,
    });
    expect(result.keywords[2]).toEqual({
      keyword: 'キーワードA',
      frequency: 3,
      rank: 3,
      impactScore: 45,
    });
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
  });
});