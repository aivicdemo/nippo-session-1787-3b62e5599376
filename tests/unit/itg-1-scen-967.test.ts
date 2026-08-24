import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation and Color Display', () => {
  test('SCEN-967: Priority score exceeding yellow threshold (51 points) displays in yellow', () => {
    // Arrange
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout in production environment',
      occurrenceFrequency: 5,
      impactScore: 51,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    // Act
    const result = calculateIssuePriorityScore(issueInput);

    // Assert
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(51);
    expect(result.priorityRank).toBe('中');
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.scoreBreakdown.impactScore).toBe(20);
    expect(typeof result.calculatedAt).toBe('string');
  });
});