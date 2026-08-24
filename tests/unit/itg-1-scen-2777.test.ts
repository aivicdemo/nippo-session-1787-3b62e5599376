import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation and Color Display', () => {
  test('SCEN-2777: Priority score at 49 (below medium threshold of 50) displays with low priority color', () => {
    const input = {
      issueId: 'issue-test-2777',
      issueContent: 'Test issue for priority threshold boundary',
      occurrenceFrequency: 5,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-test-2777',
      priorityScore: 49,
      priorityRank: '低',
      scoreBreakdown: {
        frequencyScore: 20,
        impactScore: 22,
        resolutionDifficultyScore: 7,
      },
      colorCode: '#00FF00',
      calculatedAt: expect.any(String),
    });

    expect(result.priorityScore).toBe(49);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#00FF00');
    expect(result.priorityScore).toBeLessThan(50);
  });
});