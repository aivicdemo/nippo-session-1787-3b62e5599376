import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-2380: [edge] 課題発生頻度の定量化 - 課題キーワードが1回のみ出現したとき、出現頻度を1として記録する
  test('should record occurrence frequency as 1 when issue keyword appears exactly once', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'サーバーダウン',
            frequency: 1,
            confidence: 0.95,
          },
        ],
        totalKeywordCount: 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
      })
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toEqual(
      expect.objectContaining({
        keyword: 'サーバーダウン',
        frequency: 1,
        rank: 1,
      })
    );
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(7);
  });
});