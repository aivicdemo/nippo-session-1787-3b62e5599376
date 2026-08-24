import { describe, it as test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-484: [normal] 課題自動抽出・優先度判定機能 - 高い影響度スコアを持つ課題が低い影響度スコアの課題より優先度が高くなる
  test('should rank issues by impact score in descending order', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    mockTextAnalysisService.extractKeywords
      .mockResolvedValueOnce({
        keywords: ['サーバー障害'],
        frequencies: [1],
      })
      .mockResolvedValueOnce({
        keywords: ['軽微なバグ'],
        frequencies: [1],
      });

    mockTextAnalysisService.assessImpactScore
      .mockResolvedValueOnce({
        keyword: 'サーバー障害',
        impactScore: 85,
      })
      .mockResolvedValueOnce({
        keyword: '軽微なバグ',
        impactScore: 30,
      });

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'サーバー障害',
      frequency: 1,
      rank: 1,
      impactScore: 85,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: '軽微なバグ',
      frequency: 1,
      rank: 2,
      impactScore: 30,
    });
    expect(result.totalKeywordCount).toBe(2);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisPeriodDays).toBe(7);
  });
});