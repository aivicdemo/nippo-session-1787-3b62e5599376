import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  test('SCEN-2939: Keywords below frequency threshold are classified into lower ranks', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'キーワードA', frequency: 2 },
          { keyword: 'キーワードB', frequency: 1 },
          { keyword: 'キーワードC', frequency: 0 }
        ]
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 3,
      requestUserId: 'user-manager-001'
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisService);

    expect(result).toEqual({
      keywords: [
        {
          keywordId: expect.any(String),
          keyword: 'キーワードA',
          frequency: 2,
          rank: 1
        },
        {
          keywordId: expect.any(String),
          keyword: 'キーワードB',
          frequency: 1,
          rank: 2
        },
        {
          keywordId: expect.any(String),
          keyword: 'キーワードC',
          frequency: 0,
          rank: 3
        }
      ],
      totalKeywordCount: 3,
      extractedAt: expect.any(Date),
      analysisperiodDays: 7
    });

    const keywordAResult = result.keywords.find(k => k.keyword === 'キーワードA');
    const keywordBResult = result.keywords.find(k => k.keyword === 'キーワードB');
    const keywordCResult = result.keywords.find(k => k.keyword === 'キーワードC');

    expect(keywordAResult).toBeDefined();
    expect(keywordAResult!.rank).toBe(1);

    expect(keywordBResult).toBeDefined();
    expect(keywordBResult!.rank).toBeGreaterThan(keywordAResult!.rank);

    expect(keywordCResult).toBeDefined();
    expect(keywordCResult!.rank).toBeGreaterThan(keywordBResult!.rank);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        startDate: input.startDate,
        endDate: input.endDate
      })
    );
  });
});

interface ExtractIssueKeywordsInput {
  teamId: string;
  startDate: Date;
  endDate: Date;
  minFrequencyThreshold?: number;
  requestUserId: string;
}