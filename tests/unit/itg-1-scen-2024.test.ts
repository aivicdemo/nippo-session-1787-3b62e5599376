import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Normal Flow', () => {
  // SCEN-2024
  test('should calculate priority score for server response delay issue with correct breakdown and color code', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001-server-response',
      issueContent: 'サーバーレスポンス遅延により顧客満足度が低下',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 4.5,
      reportingDate: '2024-01-15',
      teamId: 'team-backend-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001-server-response');

    const frequencyScore = Math.min(40, (input.occurrenceFrequency / 10) * 40);
    const impactScore = Math.min(40, (input.impactScore / 100) * 40);
    const resolutionDifficultyScore = Math.min(
      20,
      (input.resolutionDaysAverage / 5) * 20
    );
    const expectedPriorityScore = Math.round(
      frequencyScore + impactScore + resolutionDifficultyScore
    );

    expect(result.priorityScore).toBe(expectedPriorityScore);

    expect(result.scoreBreakdown.frequencyScore).toBe(Math.round(frequencyScore));
    expect(result.scoreBreakdown.impactScore).toBe(Math.round(impactScore));
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(
      Math.round(resolutionDifficultyScore)
    );

    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');

    expect(result.calculatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});