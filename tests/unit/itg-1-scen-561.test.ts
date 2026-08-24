import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア機能', () => {
  // SCEN-561
  test('[normal] 課題優先度判定機能 - 同じ日報に対して優先度判定を2回実行した場合、同じ影響度スコアと優先度ランクが返される', () => {
    const issuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const firstResult = calculateIssuePriorityScore(issuePriorityScoringInput);
    const secondResult = calculateIssuePriorityScore(issuePriorityScoringInput);

    expect(firstResult.issueId).toBe('issue-001');
    expect(firstResult.priorityScore).toBe(secondResult.priorityScore);
    expect(firstResult.priorityRank).toBe(secondResult.priorityRank);
    expect(firstResult.priorityRank).toBe('高');
    expect(firstResult.scoreBreakdown.impactScore).toBe(
      secondResult.scoreBreakdown.impactScore
    );
    expect(firstResult.scoreBreakdown.impactScore).toBe(30);
    expect(firstResult.scoreBreakdown.frequencyScore).toBe(
      secondResult.scoreBreakdown.frequencyScore
    );
    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondResult.scoreBreakdown.resolutionDifficultyScore
    );
    expect(firstResult.colorCode).toBe(secondResult.colorCode);
    expect(firstResult.colorCode).toBe('#FF0000');
  });
});