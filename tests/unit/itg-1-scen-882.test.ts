import { describe, it, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-882
  it('should rank keywords by cumulative frequency in descending order across multiple days with frequency reversals', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce({
          keywords: [
            { keyword: 'API設計', frequency: 5 },
            { keyword: 'DB最適化', frequency: 3 },
            { keyword: 'バグ修正', frequency: 2 },
          ],
        })
        .mockResolvedValueOnce({
          keywords: [
            { keyword: 'API設計', frequency: 4 },
            { keyword: 'DB最適化', frequency: 4 },
            { keyword: 'バグ修正', frequency: 1 },
          ],
        })
        .mockResolvedValueOnce({
          keywords: [
            { keyword: 'API設計', frequency: 1 },
            { keyword: 'DB最適化', frequency: 5 },
            { keyword: 'バグ修正', frequency: 4 },
          ],
        }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-03T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any,
    );

    expect(result.keywords).toHaveLength(3);
    
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'DB最適化',
      frequency: 12,
      rank: 1,
    });

    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'API設計',
      frequency: 10,
      rank: 2,
    });

    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'バグ修正',
      frequency: 7,
      rank: 3,
    });

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});