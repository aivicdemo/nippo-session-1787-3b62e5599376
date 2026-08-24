import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Low Impact Team Spread', () => {
  test('SCEN-610: Low team impact score is correctly reflected in priority score calculation', () => {
    // Arrange
    const issueId = 'issue-001';
    const issueContent = '軽微なバグ修正';
    const occurrenceFrequency = 1;
    const impactScore = 15; // Low team impact score
    const affectedTeamCount = 1;
    const resolutionDaysAverage = 0.5;
    const reportingDate = '2024-01-15T09:00:00Z';
    const teamId = 'team-001';

    const input = {
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    };

    // Act
    const result = calculateIssuePriorityScore(input);

    // Assert
    expect(result.issueId).toBe(issueId);
    expect(result.priorityScore).toBeLessThan(20);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#00FF00');
    expect(result.scoreBreakdown.impactScore).toBe(6);
    expect(result.scoreBreakdown.frequencyScore).toBe(4);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(10);
    expect(result.calculatedAt).toBeDefined();
  });
});