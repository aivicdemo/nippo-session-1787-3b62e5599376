import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring', () => {
  // SCEN-1605
  test('should calculate a single priority score (0-100) for extracted issue based on team impact', () => {
    const issueId = 'ISSUE-001';
    const issueContent = 'データベース接続エラーが頻発し、チーム全体の作業が停止する可能性がある';
    const occurrenceFrequency = 5;
    const impactScore = 85;
    const affectedTeamCount = 3;
    const resolutionDaysAverage = 2.5;
    const reportingDate = '2024-01-15';
    const teamId = 'TEAM-001';

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

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe(issueId);
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.priorityScore)).toBe(true);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(
      result.scoreBreakdown.frequencyScore +
        result.scoreBreakdown.impactScore +
        result.scoreBreakdown.resolutionDifficultyScore
    ).toBe(result.priorityScore);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});