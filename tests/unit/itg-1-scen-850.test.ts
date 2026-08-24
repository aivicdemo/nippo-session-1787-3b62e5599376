import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - TextAnalysisServiceAdapter Failure Handling', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn(),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-850: TextAnalysisServiceAdapterのassessImpactScoreが3回再試行後も失敗したときエラーになる
  test('should return TextAnalysisServiceError after 3 retry attempts fail with different error types', async () => {
    const retryErrors = [
      new Error('Connection timeout'),
      new Error('API response error'),
      new Error('Rate limit error'),
      new Error('Service unavailable'),
    ];

    let callCount = 0;
    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation(() => {
      const error = retryErrors[callCount];
      callCount++;
      return Promise.reject(error);
    });

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続障害',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-001',
    };

    let result: IssuePriorityScoringOutput | Error | null = null;

    try {
      result = await calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    } catch (error) {
      result = error;
    }

    // Advance first retry: 3 seconds
    jest.advanceTimersByTime(3000);

    // Advance second retry: 10 seconds
    jest.advanceTimersByTime(10000);

    // Advance third retry: 30 seconds
    jest.advanceTimersByTime(30000);

    // Verify that assessImpactScore was called 4 times (1 initial + 3 retries)
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(4);

    // Verify error is thrown with correct message pattern
    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toMatch(/TextAnalysisServiceError/);
      expect(result.message).toMatch(/課題影響度判定が利用できません/);
      expect(result.message).toMatch(/3回の再試行後/);
    }

    // Verify that priorityScore is null when cached result does not exist
    if (result && typeof result === 'object' && 'priorityScore' in result) {
      expect((result as any).priorityScore).toBeNull();
    }

    jest.useRealTimers();
  });
});