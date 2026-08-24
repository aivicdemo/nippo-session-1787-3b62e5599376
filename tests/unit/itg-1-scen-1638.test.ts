import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Impact Assessment', () => {
  // SCEN-1638: [error] 課題影響度判定・優先度スコア算出機能 - 課題キーワードが null のまま影響度判定関数に渡されたとき、処理を中止しエラーを返す
  test('should return error with INVALID_KEYWORD_NULL code when keyword is null', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: null,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toBeDefined();
    expect(result.priorityScore).toBeNull();
    expect(result.errorCode).toBe('INVALID_KEYWORD_NULL');
    expect(result.errorMessage).toMatch(/課題キーワードが指定されていません/);
  });
});