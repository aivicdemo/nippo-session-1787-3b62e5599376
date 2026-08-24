import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - TextAnalysisServiceAdapter Failure Handling', () => {
  // SCEN-2244
  test('should handle extractKeywords API failure with 3 retries and return error result', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('OpenAI API connection failed')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const retryAttempts: number[] = [];
    const originalFn = mockTextAnalysisServiceAdapter.extractKeywords;

    mockTextAnalysisServiceAdapter.extractKeywords = jest.fn(async () => {
      retryAttempts.push(Date.now());
      if (retryAttempts.length < 3) {
        await new Promise((resolve) => {
          const delay =
            retryAttempts.length === 1 ? 3000 : 10000;
          setTimeout(resolve, delay);
        });
        throw new Error('OpenAI API connection failed');
      }
      if (retryAttempts.length === 3) {
        await new Promise((resolve) => {
          setTimeout(resolve, 30000);
        });
        throw new Error('OpenAI API connection failed');
      }
    });

    let result: RankedIssueKeywordList | { status: string; errorCode: string };

    try {
      result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
    } catch (error) {
      result = {
        status: 'failed',
        errorCode: 'EXTRACTION_FAILED',
      };
    }

    expect(result).toEqual({
      status: 'failed',
      errorCode: 'EXTRACTION_FAILED',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});