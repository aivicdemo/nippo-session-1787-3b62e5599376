import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Score Edge Cases', () => {
  test('SCEN-2179: Issue with impact score at maximum (100) receives highest priority rank', () => {
    const issueWithMaxImpact = {
      issueId: 'issue-critical-001',
      issueContent: 'Critical system failure affecting all teams',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 10,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    const result = calculateIssuePriorityScore(issueWithMaxImpact);

    expect(result.issueId).toBe('issue-critical-001');
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore + result.scoreBreakdown.impactScore + result.scoreBreakdown.resolutionDifficultyScore).toBe(100);
  });
});