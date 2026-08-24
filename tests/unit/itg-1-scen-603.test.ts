import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation with Zero Issues', () => {
  // SCEN-603
  test('should generate empty priority-ranked issue list when no issues are extracted', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-empty-test',
      issueContent: 'Test content with no actual issues',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-empty-test',
      priorityScore: 0,
      priorityRank: '低',
      scoreBreakdown: {
        frequencyScore: 0,
        impactScore: 0,
        resolutionDifficultyScore: 0,
      },
      colorCode: '#00FF00',
      calculatedAt: expect.any(String),
    });

    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('低');
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result.colorCode).toBe('#00FF00');
    expect(typeof result.calculatedAt).toBe('string');
    expect(new Date(result.calculatedAt).getTime()).toBeGreaterThan(0);
  });
});