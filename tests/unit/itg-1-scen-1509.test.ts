import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-1509
  test('前週の日報から0件の課題が抽出された場合、優先度ランクが決定されない', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-08T09:00:00Z',
      teamId: 'team-a',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('低');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 0,
      impactScore: 0,
      resolutionDifficultyScore: 0,
    });
    expect(result.colorCode).toBe('#00FF00');
    expect(typeof result.calculatedAt).toBe('string');
  });
});