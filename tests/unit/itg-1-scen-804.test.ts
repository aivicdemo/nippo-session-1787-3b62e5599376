import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - External Service Failure Handling', () => {
  let mockTextAnalysisService: {
    assessImpactScore: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockTextAnalysisService = {
      assessImpactScore: jest.fn(),
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SCEN-804: TextAnalysisServiceAdapter の assessImpactScore が失敗したとき処理が中断される
  test('should handle assessImpactScore failure with exponential backoff retry (3+1 attempts) and fail gracefully', async () => {
    // Setup: Mock the TextAnalysisServiceAdapter to fail on all retry attempts
    const failureError = new Error('API timeout exceeded 30 seconds');
    mockTextAnalysisService.assessImpactScore.mockRejectedValue(failureError);

    // Input: Issue data with extracted keywords
    const priorityScoringInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'ネットワーク遅延により、デプロイが失敗する可能性がある',
      occurrenceFrequency: 5,
      impactScore: 0, // Will be calculated by assessImpactScore
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    // Execute: Call calculateIssuePriorityScore with failing service
    const resultPromise = calculateIssuePriorityScore(
      priorityScoringInput,
      mockTextAnalysisService
    );

    // Verify: First call to assessImpactScore is made immediately
    await jest.advanceTimersByTimeAsync(0);
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledWith(
      priorityScoringInput.issueContent
    );

    // Advance 3 seconds for first retry interval
    await jest.advanceTimersByTimeAsync(3000);
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(2);

    // Advance 10 seconds for second retry interval (cumulative: 13 seconds)
    await jest.advanceTimersByTimeAsync(10000);
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(3);

    // Advance 30 seconds for third retry interval (cumulative: 43 seconds)
    await jest.advanceTimersByTimeAsync(30000);
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(4);

    // Verify: All 4 calls (1 initial + 3 retries) have been executed
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(4);

    // Execute: Await the final result
    let error: Error | null = null;
    let result = null;
    try {
      result = await resultPromise;
    } catch (e) {
      error = e as Error;
    }

    // Verify: Process is aborted and error is caught
    expect(error).not.toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/課題分析|一時的に利用できません|手動入力/i);

    // Verify: Result is null or contains error indicator
    if (result !== null) {
      expect(result).toHaveProperty('error');
    }

    // Verify: No infinite retries occur (exactly 4 attempts: 1 + 3 retries)
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(4);
  });
});