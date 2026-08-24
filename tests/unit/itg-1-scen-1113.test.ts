import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - extractAndRankIssueKeywords', () => {
  // SCEN-1113
  test('should return empty ranked keyword list when no extracted challenges are provided', async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toEqual([]);
    expect(result.keywords.length).toBe(0);
    expect(result.totalKeywordCount).toBe(0);
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('object');
    expect(result.analysisperiodDays).toBe(7);
  });
});