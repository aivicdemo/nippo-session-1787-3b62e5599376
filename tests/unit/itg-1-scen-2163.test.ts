import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能 - エラーハンドリング', () => {
  // SCEN-2163
  test('発生頻度カウントが負の数のとき、エラーが発生する', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: -5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/発生頻度/);
  });
});