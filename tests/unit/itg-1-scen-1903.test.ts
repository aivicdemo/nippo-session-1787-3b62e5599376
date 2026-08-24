import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  test('SCEN-1903: Edge case - fractional occurrence frequencies are correctly rounded and ranked', async () => {
    // Arrange: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database_connection_issue', frequency: 3 },
          { keyword: 'memory_leak', frequency: 2 },
          { keyword: 'api_timeout', frequency: 1 },
        ],
        totalKeywordCount: 6,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-05T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    // Act: Call extractAndRankIssueKeywords with test data
    // Analysis period: 5 days
    // Keyword occurrences:
    // - database_connection_issue: 3 occurrences → frequency = 3/5 = 0.6
    // - memory_leak: 2 occurrences → frequency = 2/5 = 0.4
    // - api_timeout: 1 occurrence → frequency = 1/5 = 0.2
    // After rounding (standard rounding / round-half-up):
    // - 0.6 → 1 (rounds to 1)
    // - 0.4 → 0 (rounds to 0, but minFrequencyThreshold = 1 filters it out)
    // - 0.2 → 0 (rounds to 0, filtered out)
    // Expected ranking should reflect the rounded frequency values

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    // Assert: Verify the structure and content
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Verify analysis period calculation
    const expectedAnalysisDays = 5;
    expect(result.analysisperiodDays).toBe(expectedAnalysisDays);

    // Verify total keyword count (unfiltered)
    expect(result.totalKeywordCount).toBe(6);

    // Verify keywords array contains only entries meeting minFrequencyThreshold
    expect(Array.isArray(result.keywords)).toBe(true);

    // After rounding, only database_connection_issue with frequency 1 should remain
    // (memory_leak rounds to 0, api_timeout rounds to 0)
    const filteredKeywords = result.keywords.filter(
      (kw) => kw.frequency >= input.minFrequencyThreshold!,
    );
    expect(filteredKeywords.length).toBeGreaterThan(0);

    // Verify the top-ranked keyword (database_connection_issue)
    const topKeyword = result.keywords[0];
    expect(topKeyword).toHaveProperty('keywordId');
    expect(topKeyword).toHaveProperty('keyword');
    expect(topKeyword).toHaveProperty('frequency');
    expect(topKeyword).toHaveProperty('rank');

    // Verify ranking is in descending order by frequency
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency,
      );
      expect(result.keywords[i].rank).toBeLessThan(result.keywords[i + 1].rank);
    }

    // Verify rounded frequency value for top keyword (0.6 rounds to 1)
    expect(topKeyword.frequency).toBe(1);
    expect(topKeyword.rank).toBe(1);

    // Verify extractedAt is set to current time (approximately)
    const extractedAt = new Date(result.extractedAt);
    const now = new Date();
    const timeDifference = Math.abs(now.getTime() - extractedAt.getTime());
    expect(timeDifference).toBeLessThan(5000); // Within 5 seconds

    // Verify mockTextAnalysisServiceAdapter was called
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});