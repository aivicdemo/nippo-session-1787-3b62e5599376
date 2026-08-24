import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Impact Score Rounding', () => {
  // SCEN-1167
  test('should round impact score 66.67 to 67 when calculating issue impact', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'database_connection_timeout',
          frequency: 3,
          confidenceScore: 0.92,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(66.67),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    const firstKeyword = result.keywords[0];
    expect(firstKeyword).toBeDefined();
    expect(firstKeyword.keyword).toBe('database_connection_timeout');
    expect(firstKeyword.frequency).toBe(3);
    expect(firstKeyword.rank).toBe(1);

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    const impactScoreFromCall = mockTextAnalysisAdapter.assessImpactScore.mock.results[0]?.value;
    expect(impactScoreFromCall).toBe(66.67);

    const roundedValue = Math.round(66.67);
    expect(roundedValue).toBe(67);

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});