import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Idempotent Search', () => {
  // SCEN-1882
  test('should return identical results when executing the same search twice with identical conditions', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'サーバーダウン', frequency: 3 },
        { keyword: '納期遅延', frequency: 2 },
      ]),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(60),
      classifyIssueSeverity: jest.fn(),
    };

    const searchInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const reportingDate1 = new Date('2024-01-12T09:30:00Z');
    const reportingDate2 = new Date('2024-01-12T09:30:00Z');

    const firstResult: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      searchInput,
      mockTextAnalysisAdapter,
      reportingDate1,
    );

    const secondResult: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      searchInput,
      mockTextAnalysisAdapter,
      reportingDate2,
    );

    expect(firstResult.keywords.length).toBe(secondResult.keywords.length);
    expect(firstResult.keywords.length).toBe(2);

    expect(firstResult.keywords[0].keywordId).toBe(secondResult.keywords[0].keywordId);
    expect(firstResult.keywords[1].keywordId).toBe(secondResult.keywords[1].keywordId);

    expect(firstResult.keywords[0].keyword).toBe(secondResult.keywords[0].keyword);
    expect(firstResult.keywords[0].keyword).toBe('サーバーダウン');
    expect(firstResult.keywords[1].keyword).toBe(secondResult.keywords[1].keyword);
    expect(firstResult.keywords[1].keyword).toBe('納期遅延');

    expect(firstResult.keywords[0].rank).toBe(secondResult.keywords[0].rank);
    expect(firstResult.keywords[0].rank).toBe(1);
    expect(firstResult.keywords[1].rank).toBe(secondResult.keywords[1].rank);
    expect(firstResult.keywords[1].rank).toBe(2);

    expect(firstResult.keywords[0].frequency).toBe(secondResult.keywords[0].frequency);
    expect(firstResult.keywords[0].frequency).toBe(3);
    expect(firstResult.keywords[1].frequency).toBe(secondResult.keywords[1].frequency);
    expect(firstResult.keywords[1].frequency).toBe(2);

    expect(firstResult.totalKeywordCount).toBe(secondResult.totalKeywordCount);
    expect(firstResult.totalKeywordCount).toBe(2);

    expect(firstResult.analysisperiodDays).toBe(secondResult.analysisperiodDays);
    expect(firstResult.analysisperiodDays).toBe(7);
  });
});