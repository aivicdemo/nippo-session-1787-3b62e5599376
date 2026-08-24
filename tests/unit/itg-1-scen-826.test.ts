import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-826: [normal] 課題キーワード自動抽出・ランク付け機能 - 複数日分の日報から抽出された課題キーワードが発生頻度の高い順にランク付けされて返される
  test('should extract and rank issue keywords by frequency in descending order', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'A', frequency: 5 },
          { keyword: 'B', frequency: 3 },
          { keyword: 'C', frequency: 7 },
          { keyword: 'D', frequency: 2 }
        ]
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-03T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    expect(result.keywords).toHaveLength(4);
    expect(result.keywords[0]).toEqual({
      keyword: 'C',
      frequency: 7,
      rank: 1
    });
    expect(result.keywords[1]).toEqual({
      keyword: 'A',
      frequency: 5,
      rank: 2
    });
    expect(result.keywords[2]).toEqual({
      keyword: 'B',
      frequency: 3,
      rank: 3
    });
    expect(result.keywords[3]).toEqual({
      keyword: 'D',
      frequency: 2,
      rank: 4
    });
    expect(result.totalKeywordCount).toBe(4);
    expect(result.analysisperiodDays).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});