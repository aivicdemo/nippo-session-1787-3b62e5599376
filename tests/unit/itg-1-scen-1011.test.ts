import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction - Zero Keywords Scenario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1011: [normal] 課題キーワード自動抽出機能 - 日報から課題キーワードが抽出されない（0件）
  test('should return empty keyword list when no issues are detected in reports', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-chief-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toEqual([]);
    expect(result.totalKeywordCount).toBe(0);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
      })
    );
  });
});