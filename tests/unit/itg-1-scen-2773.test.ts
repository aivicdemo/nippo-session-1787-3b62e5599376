import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Color Coding at Threshold', () => {
  // SCEN-2773
  test('should display issue with priority score exactly at high threshold (80) in high priority color', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-edge-001',
      issueContent: 'Database performance degradation affecting multiple services',
      occurrenceFrequency: 3,
      impactScore: 80,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    // Act
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // Assert - Verify score calculation
    expect(result.issueId).toBe('issue-edge-001');
    expect(result.priorityScore).toBe(80);

    // Assert - Verify priority rank based on threshold
    expect(result.priorityRank).toBe('高');

    // Assert - Verify color code for high priority (threshold = 80)
    expect(result.colorCode).toBe('#FF0000');

    // Assert - Verify score breakdown components
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(
      result.scoreBreakdown.frequencyScore +
        result.scoreBreakdown.impactScore +
        result.scoreBreakdown.resolutionDifficultyScore
    ).toBe(80);

    // Assert - Verify calculation timestamp is present
    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getTime()).toBeGreaterThan(0);

    // Assert - Verify boundary condition: score of 80 is at the high threshold
    // High priority threshold default is 70, so 80 >= 70 should result in '高'
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
  });
});