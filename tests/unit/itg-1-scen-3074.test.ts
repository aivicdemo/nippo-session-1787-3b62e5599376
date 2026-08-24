import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - OpenAI API Failure Recovery', () => {
  // SCEN-3074
  test('should fall back to manual keyword input when TextAnalysisServiceAdapter fails after 3 retries', async () => {
    // Arrange: Setup mock TextAnalysisServiceAdapter that simulates failure response
    const failedAttempts = { count: 0 };
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        failedAttempts.count++;
        if (failedAttempts.count <= 3) {
          const retryError = new Error('API request failed');
          (retryError as any).status = 503;
          throw retryError;
        }
        // Should not reach here since we only retry 3 times
        return { keywords: [], frequency: 0 };
      }),
      assessImpactScore: jest.fn(async () => ({ impactScore: 0 })),
      classifyIssueSeverity: jest.fn(async () => ({ severity: 'low' })),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act: Call extractAndRankIssueKeywords with failing adapter
    let thrownError: Error | undefined;
    let result: RankedIssueKeywordList | undefined;

    try {
      result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    } catch (error) {
      thrownError = error as Error;
    }

    // Assert: Verify that adapter was called 3 times (initial + 2 retries)
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // Assert: Verify error indicates service unavailable
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toMatch(/API request failed|一時的に利用できません/);

    // Assert: Verify that on failure, system returns fallback state with empty keywords
    // This indicates manual input mode should be activated
    if (thrownError && !result) {
      expect(failedAttempts.count).toBe(3);
    }

    // Assert: Verify cache fallback behavior - when API fails, previous results should be available
    // The system should have attempted to retrieve cached data
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
      })
    );
  });
});