import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Impact Score Determination', () => {
  // SCEN-1347
  test('should classify issue as low priority when impact score is below medium threshold (39 points)', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 2,
      impactScore: 39,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.priorityRank).toBe('低');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.colorCode).toBe('#00FF00');
    expect(result.issueId).toBe('issue-001');
    expect(typeof result.calculatedAt).toBe('string');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
  });
});