import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Keyword Ranking', () => {
  // SCEN-2300: [edge] 課題発生頻度ランキング機能 - 日報データ内に重複する課題キーワードが含まれる場合、各出現が正確にカウントされる
  test('should accurately count duplicate issue keywords appearing three times in report data', async () => {
    // Arrange: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'ネットワーク遅延',
            frequency: 3,
            confidence: 0.95,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const reportContent =
      '昨日：ネットワーク遅延で作業中断。今日：ネットワーク遅延の原因調査。課題：ネットワーク遅延が継続中';

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    // Act: Call extractAndRankIssueKeywords with mocked adapter
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
    );

    // Assert: Verify that duplicate keyword 'ネットワーク遅延' is counted exactly 3 times
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      reportContent,
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ネットワーク遅延',
      frequency: 3,
      rank: 1,
    });

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisperiodDays).toBe(7);
  });
});