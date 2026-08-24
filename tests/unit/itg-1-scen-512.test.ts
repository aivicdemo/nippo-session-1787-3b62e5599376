import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-512
  test('should calculate issue priority score with 100% frequency when all 10 team members report the same keyword', () => {
    const issueId = 'issue-db-001';
    const issueContent = 'Database connection error occurred during batch processing';
    const occurrenceFrequency = 10;
    const impactScore = 85;
    const affectedTeamCount = 10;
    const resolutionDaysAverage = 2;
    const reportingDate = '2024-01-15T09:30:00Z';
    const teamId = 'team-engineering-001';

    const result = calculateIssuePriorityScore({
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    });

    expect(result.issueId).toBe(issueId);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeTruthy();
    const calculatedAtDate = new Date(result.calculatedAt);
    expect(calculatedAtDate.getTime()).toBeGreaterThan(0);
  });
});