import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

// Mock interface for TextAnalysisServiceAdapter
interface MockTextAnalysisServiceAdapter {
  extractKeywords: jest.Mock;
}

describe('Issue Extraction and Ranking - Stable Sort for Equal Frequencies', () => {
  let mockTextAnalysisServiceAdapter: MockTextAnalysisServiceAdapter;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  // SCEN-1502
  test('should output keywords with equal frequency in stable sorted order across multiple executions', async () => {
    // Setup: Mock extractKeywords to return keywords with equal frequencies
    const mockExtractedKeywords = [
      { keyword: 'データベース接続', frequency: 5 },
      { keyword: 'API遅延', frequency: 5 },
      { keyword: 'デプロイエラー', frequency: 5 },
      { keyword: 'ログ出力', frequency: 3 },
    ];

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue(
      mockExtractedKeywords
    );

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Execute the function multiple times and collect results
    const executionResults: string[][] = [];
    const executionCount = 3;

    for (let i = 0; i < executionCount; i++) {
      const result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter as any
      );

      // Extract keywords in order from result
      const keywordOrder = result.keywords.map((k) => k.keyword);
      executionResults.push(keywordOrder);
    }

    // Verify that keywords with equal frequency (5) appear in stable order
    const expectedEqualFrequencyKeywords = [
      'データベース接続',
      'API遅延',
      'デプロイエラー',
    ];

    // Verify all three executions have the same order
    expect(executionResults[0]).toEqual(executionResults[1]);
    expect(executionResults[1]).toEqual(executionResults[2]);

    // Verify the order matches expected stable sorting
    expect(executionResults[0]).toEqual(
      expect.arrayContaining(expectedEqualFrequencyKeywords)
    );

    // Verify frequency ranking is correct
    const firstExecution = executionResults[0];
    expect(firstExecution[0]).toBe('データベース接続');
    expect(firstExecution[1]).toBe('API遅延');
    expect(firstExecution[2]).toBe('デプロイエラー');
    expect(firstExecution[3]).toBe('ログ出力');

    // Verify rank field is correct
    expect(executionResults[0].length).toBe(4);
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter as any
    );

    // Verify output structure
    expect(result.keywords).toHaveLength(4);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].rank).toBe(3);
    expect(result.keywords[3].rank).toBe(4);

    // Verify frequency values match input
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[1].frequency).toBe(5);
    expect(result.keywords[2].frequency).toBe(5);
    expect(result.keywords[3].frequency).toBe(3);

    // Verify totalKeywordCount is correct (all keywords before filtering)
    expect(result.totalKeywordCount).toBe(4);

    // Verify analysisperiodDays calculation
    const expectedDays = 7; // 2024-01-15 to 2024-01-21 inclusive
    expect(result.analysisperiodDays).toBe(expectedDays);

    // Verify extractedAt is set
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});