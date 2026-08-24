import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-943
  test('優先度スコアが数値以外の型のときエラーを返す', () => {
    const malformedInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '重要な課題',
      occurrenceFrequency: 5,
      impactScore: NaN,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    expect(() => {
      calculateIssuePriorityScore(malformedInput);
    }).toThrow(/優先度スコア.*数値/);
  });
});