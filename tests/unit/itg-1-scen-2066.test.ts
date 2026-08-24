import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Dashboard Color Display', () => {
  // SCEN-2066
  test('should calculate priority score and assign correct color code for approved countermeasure', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: 'CP-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 15,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001'
    };

    // Act
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // Assert - Verify priority score calculation
    // Formula breakdown:
    // - frequencyScore: min(15 / 30 * 40, 40) = 20
    // - impactScore: 85 (0-100 scale, maps to 0-40) = 34
    // - resolutionDifficultyScore: min(2.5 / 5 * 20, 20) = 10
    // - totalPriorityScore: 20 + 34 + 10 = 64
    expect(result.issueId).toBe('CP-001');
    expect(result.priorityScore).toBe(64);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown.frequencyScore).toBe(20);
    expect(result.scoreBreakdown.impactScore).toBe(34);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(10);
    
    // Verify color code assignment based on priority thresholds
    // Thresholds: high >= 70, medium >= 40, low < 40
    // Score 64 falls into medium range, should return yellow
    expect(result.colorCode).toBe('#FFFF00');
    
    // Verify calculated timestamp is in ISO 8601 format
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});