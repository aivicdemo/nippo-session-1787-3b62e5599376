import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-937
  test('should return identical priority score and color code when calculating twice with same issue data', () => {
    const testIssueData: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラーが頻発',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'TEAM-A',
    };

    const firstExecutionResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(testIssueData);
    const secondExecutionResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(testIssueData);

    expect(firstExecutionResult.issueId).toBe('ISSUE-001');
    expect(secondExecutionResult.issueId).toBe('ISSUE-001');

    expect(firstExecutionResult.priorityScore).toBe(secondExecutionResult.priorityScore);
    expect(firstExecutionResult.colorCode).toBe(secondExecutionResult.colorCode);

    expect(firstExecutionResult.priorityRank).toBe(secondExecutionResult.priorityRank);

    expect(firstExecutionResult.scoreBreakdown.frequencyScore).toBe(
      secondExecutionResult.scoreBreakdown.frequencyScore
    );
    expect(firstExecutionResult.scoreBreakdown.impactScore).toBe(
      secondExecutionResult.scoreBreakdown.impactScore
    );
    expect(firstExecutionResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondExecutionResult.scoreBreakdown.resolutionDifficultyScore
    );

    expect(typeof firstExecutionResult.priorityScore).toBe('number');
    expect(firstExecutionResult.priorityScore).toBeGreaterThanOrEqual(1);
    expect(firstExecutionResult.priorityScore).toBeLessThanOrEqual(100);

    expect(firstExecutionResult.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(['高', '中', '低']).toContain(firstExecutionResult.priorityRank);
  });
});