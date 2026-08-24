import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1517
  test('同じ入力データで優先度スコア算出を2回実行した場合、同じ結果が返される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続タイムアウトが頻発している問題',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001'
    };

    const firstExecutionResult = calculateIssuePriorityScore(input);
    const secondExecutionResult = calculateIssuePriorityScore(input);

    expect(firstExecutionResult.priorityScore).toBe(secondExecutionResult.priorityScore);
    expect(firstExecutionResult.priorityRank).toBe(secondExecutionResult.priorityRank);
    expect(firstExecutionResult.colorCode).toBe(secondExecutionResult.colorCode);
    expect(firstExecutionResult.scoreBreakdown.frequencyScore).toBe(
      secondExecutionResult.scoreBreakdown.frequencyScore
    );
    expect(firstExecutionResult.scoreBreakdown.impactScore).toBe(
      secondExecutionResult.scoreBreakdown.impactScore
    );
    expect(firstExecutionResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondExecutionResult.scoreBreakdown.resolutionDifficultyScore
    );
  });
});