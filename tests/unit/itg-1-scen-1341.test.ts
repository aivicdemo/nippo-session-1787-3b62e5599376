import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1341: [edge] 課題キーワード自動抽出機能 - 1000件を超える大規模キーワード抽出
  test('should complete keyword extraction processing within 30 seconds when extracting over 1000 keywords', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValueOnce({
        keywords: Array.from({ length: 1001 }, (_, i) => ({
          keyword: `issue_keyword_${i}`,
          frequency: Math.floor(Math.random() * 100) + 1,
        })),
        extractedAt: new Date('2024-01-15T10:30:00Z'),
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const largeReportText = Array.from({ length: 5000 }, (_, i) => {
      const keywordIndex = i % 1001;
      return `issue_keyword_${keywordIndex}`;
    }).join(' ');

    const extractInput: ExtractIssueKeywordsInput = {
      teamId: 'team_001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user_pm_001',
    };

    const processingStartTime = Date.now();

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractInput,
      largeReportText,
      mockTextAnalysisServiceAdapter
    );

    const processingEndTime = Date.now();
    const processingTimeMs = processingEndTime - processingStartTime;

    expect(processingTimeMs).toBeLessThan(30000);
    expect(result.keywords).toHaveLength(1001);
    expect(result.totalKeywordCount).toBe(1001);
    expect(result.extractedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.analysisperiodDays).toBe(8);

    result.keywords.forEach((keyword, index) => {
      expect(keyword.keywordId).toBeDefined();
      expect(keyword.keyword).toMatch(/^issue_keyword_\d+$/);
      expect(keyword.frequency).toBeGreaterThanOrEqual(1);
      expect(keyword.rank).toBeGreaterThanOrEqual(1);
      expect(keyword.rank).toBeLessThanOrEqual(1001);

      if (index > 0) {
        expect(result.keywords[index - 1].frequency).toBeGreaterThanOrEqual(
          result.keywords[index].frequency
        );
      }
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      largeReportText,
      expect.any(Number)
    );
  });
});