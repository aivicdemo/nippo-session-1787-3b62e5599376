import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

// Mock TextAnalysisServiceAdapter
interface MockTextAnalysisServiceAdapter {
  assessImpactScore: jest.Mock<Promise<number>>;
}

describe('課題の影響度判定と優先度スコア計算', () => {
  let mockTextAnalysisServiceAdapter: MockTextAnalysisServiceAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn(),
    };
  });

  // SCEN-805: [error] 課題優先度スコア算出機能 - TextAnalysisServiceAdapter の assessImpactScore がタイムアウト時に 3 回再試行後も失敗すると処理が中断される
  test('should retry assessImpactScore 3 times with exponential backoff and fail gracefully after 4th attempt', async () => {
    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害により複数プロジェクトが影響',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    // Setup mock to fail with timeout on all 4 calls
    const timeoutError = new Error('Request timeout exceeded 30 seconds');
    mockTextAnalysisServiceAdapter.assessImpactScore
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError);

    let result: IssuePriorityScoringOutput | null = null;
    let caughtError: Error | null = null;

    try {
      result = await calculateIssuePriorityScore(
        testInput,
        mockTextAnalysisServiceAdapter as any
      );
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify retry attempts with exponential backoff intervals
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(4);

    // Verify call sequence
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenNthCalledWith(
      1,
      'システム障害により複数プロジェクトが影響'
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenNthCalledWith(
      2,
      'システム障害により複数プロジェクトが影響'
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenNthCalledWith(
      3,
      'システム障害により複数プロジェクトが影響'
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenNthCalledWith(
      4,
      'システム障害により複数プロジェクトが影響'
    );

    // Verify timeout intervals: 3 sec -> 10 sec -> 30 sec
    // After 1st failure: 3000ms
    jest.advanceTimersByTime(3000);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(2);

    // After 2nd failure: 10000ms
    jest.advanceTimersByTime(10000);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // After 3rd failure: 30000ms
    jest.advanceTimersByTime(30000);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(4);

    // Verify error is thrown or fallback result is returned
    expect(caughtError?.message).toMatch(/タイムアウト|利用できません|分析|一時的/);

    // Verify that result is either null or contains cached/fallback data
    if (result) {
      expect(result.priorityScore).toBeDefined();
      expect(result.priorityRank).toMatch(/高|中|低/);
      expect(result.calculatedAt).toBeDefined();
    } else {
      expect(result).toBeNull();
    }

    jest.useRealTimers();
  });
});