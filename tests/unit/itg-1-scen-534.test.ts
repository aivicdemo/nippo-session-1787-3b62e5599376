import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-534
  test('should return failure after 3 retries when TextAnalysisServiceAdapter.extractKeywords times out', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    let callCount = 0;
    const timeoutDelayMs = 31000;

    mockTextAnalysisAdapter.extractKeywords.mockImplementation(
      () =>
        new Promise((_, reject) => {
          callCount++;
          setTimeout(
            () => reject(new Error('API timeout: 30 second limit exceeded')),
            timeoutDelayMs
          );
        })
    );

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const startTime = Date.now();
    let result: RankedIssueKeywordList | null = null;
    let thrownError: Error | null = null;

    try {
      result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    } catch (error) {
      thrownError = error as Error;
    }

    const elapsedTimeMs = Date.now() - startTime;

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(4);

    expect(elapsedTimeMs).toBeGreaterThanOrEqual(43000);

    expect(result === null || thrownError !== null).toBe(true);

    if (thrownError) {
      expect(thrownError.message).toMatch(/タイムアウト|timeout|利用できません/i);
    }

    if (result) {
      expect(result.keywords).toEqual([]);
    }
  });
});