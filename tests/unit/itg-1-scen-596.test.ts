import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Impact Score Edge Cases', () => {
  test('SCEN-596: impact score 0 results in low priority rank', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 2,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001'
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.priorityRank).toBe('低');
    expect(result.priorityScore).toBeLessThan(40);
    expect(result.colorCode).toBe('#00FF00');
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.issueId).toBe('issue-001');
    expect(result.calculatedAt).toBeDefined();
  });
});