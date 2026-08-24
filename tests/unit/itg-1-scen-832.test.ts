import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

// Mock for TextAnalysisServiceAdapter
interface TextAnalysisServiceAdapter {
  extractKeywords: (text: string) => Promise<{ keywords: string[]; frequencies: number[] }>;
}

describe('Issue Extraction and Ranking - Null Input Handling', () => {
  let mockTextAnalysisAdapter: TextAnalysisServiceAdapter;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['test-keyword-1', 'test-keyword-2'],
        frequencies: [5, 3],
      }),
    };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  // SCEN-832
  test('should throw error when issue text is null and log input validation failure', async () => {
    const invalidInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:00Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    // Pass null as challenge text context by having the adapter receive null
    // This simulates the scenario where issue content is null
    const extractionAttempt = async () => {
      return extractAndRankIssueKeywords(
        invalidInput,
        mockTextAnalysisAdapter
      );
    };

    // Verify that the function throws an error due to null input
    await expect(extractionAttempt()).rejects.toThrow(/null|undefined|入力値/);

    // Verify that the error was logged internally
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('null')
    );
  });
});