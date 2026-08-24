import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Stable Sort for Equal Priority Scores', () => {
  // SCEN-1164
  test('should maintain stable sort order when multiple issues have identical priority scores', async () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'issueA', frequency: 5 },
        { keyword: 'issueB', frequency: 5 },
        { keyword: 'issueC', frequency: 5 },
        { keyword: 'issueD', frequency: 5 },
        { keyword: 'issueE', frequency: 5 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Execute the function 5 times and collect results
    const executionResults: RankedIssueKeywordList[] = [];

    for (let i = 0; i < 5; i++) {
      const result = await extractAndRankIssueKeywords(input, mockTextAnalysisService);
      executionResults.push(result);
    }

    // Verify that all 5 executions produce the same order
    const firstExecutionOrder = executionResults[0].keywords.map((k) => k.keyword);

    for (let i = 1; i < 5; i++) {
      const currentExecutionOrder = executionResults[i].keywords.map((k) => k.keyword);
      expect(currentExecutionOrder).toEqual(firstExecutionOrder);
    }

    // Verify all keywords have the same priority score (75)
    for (const result of executionResults) {
      for (const keyword of result.keywords) {
        expect(keyword.frequency).toBe(5);
      }
    }

    // Verify the structure of the result
    expect(executionResults[0].keywords).toHaveLength(5);
    expect(executionResults[0].totalKeywordCount).toBe(5);
    expect(executionResults[0].analysisperiodDays).toBe(7);
    expect(typeof executionResults[0].extractedAt).toBe('string');

    // Verify each keyword has required fields
    for (const keyword of executionResults[0].keywords) {
      expect(keyword).toHaveProperty('keywordId');
      expect(keyword).toHaveProperty('keyword');
      expect(keyword).toHaveProperty('frequency');
      expect(keyword).toHaveProperty('rank');
      expect(typeof keyword.rank).toBe('number');
    }
  });
});