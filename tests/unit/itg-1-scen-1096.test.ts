import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Priority Score Calculation with Decimal Rounding', () => {
  test('SCEN-1096: Should round priority score to 1 decimal place when fractional value occurs', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database performance degradation affecting multiple teams',
      occurrenceFrequency: 8,
      impactScore: 45.67,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(46.7);
    expect(result.scoreBreakdown).toEqual(
      expect.objectContaining({
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number),
      })
    );
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeDefined();
  });
});