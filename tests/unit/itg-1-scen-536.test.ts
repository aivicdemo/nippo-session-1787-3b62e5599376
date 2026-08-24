import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - TextAnalysisServiceAdapter timeout handling', () => {
  // SCEN-536: [error] 課題キーワード自動抽出・優先度判定機能 - TextAnalysisServiceAdapterのassessImpactScoreが30秒以内にタイムアウトした場合、3回の再試行後に失敗を返す
  test('should return failure after 3 retries when assessImpactScore times out at 30 seconds', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async () => ({
        keywords: [
          { keyword: 'database_performance', frequency: 5 },
          { keyword: 'memory_leak', frequency: 3 },
          { keyword: 'API_timeout', frequency: 2 }
        ],
        totalCount: 10
      })),
      assessImpactScore: jest.fn(async () => {
        // Simulate 30 second timeout by throwing a timeout error
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('assessImpactScore timeout: 30000ms exceeded')), 100);
        });
      }),
      classifyIssueSeverity: jest.fn(async () => ({ severity: 'high' }))
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-123',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-456'
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    // Verify the result indicates failure
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/timeout/i);
    expect(result.retryCount).toBe(3);

    // Verify assessImpactScore was called 4 times (initial + 3 retries)
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(4);

    // Verify extractKeywords was still called to attempt the operation
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});