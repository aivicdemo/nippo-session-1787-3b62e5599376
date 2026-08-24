import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Edge Case: Threshold Boundary (79)', () => {
  // SCEN-2774
  test('should assign medium priority color when priority score is exactly 79 (just below high threshold of 80)', () => {
    // Arrange
    const issuePriorityScoringInput = {
      issueId: 'issue-2774-edge-test',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 12,
      impactScore: 45,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    // Act
    const result = calculateIssuePriorityScore(issuePriorityScoringInput);

    // Assert
    // Verify that the calculated priority score is 79 (edge case below threshold)
    // Score breakdown:
    // - frequencyScore: 12 occurrences * 3.33 = ~40 (max 40)
    // - impactScore: 45 (0-100 mapped to 0-40 scale) = 18 (45/100 * 40)
    // - resolutionDifficultyScore: 2.5 days avg, normalized to difficulty score = 21 (max 20, capped)
    // Total: 40 + 18 + 21 = 79
    expect(result.issueId).toBe('issue-2774-edge-test');
    expect(result.priorityScore).toBe(79);
    expect(result.priorityRank).toBe('中');
    expect(result.colorCode).toBe('#FFFF00');
    
    // Verify score breakdown correctness
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(18);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(21);
    
    // Verify that this is indeed below the high priority threshold of 80
    expect(result.priorityScore).toBeLessThan(80);
    expect(result.priorityScore).toBeGreaterThanOrEqual(40); // Should meet medium priority minimum threshold
    
    // Verify calculatedAt is a valid ISO 8601 timestamp
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});