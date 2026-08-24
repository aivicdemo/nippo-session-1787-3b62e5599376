import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1540: [edge] 課題優先度スコア算出機能 - 影響度スコアがちょうど波及度判定閾値（例：70ポイント）で中ランクに昇格される
  test('影響度スコアが波及度判定閾値70ポイントの場合、課題ランクが中ランクに昇格する', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'テスト環境でのデータベース接続エラーが頻発',
      occurrenceFrequency: 5,
      impactScore: 70,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(63);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown.frequencyScore).toBe(20);
    expect(result.scoreBreakdown.impactScore).toBe(28);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(15);
    expect(result.colorCode).toBe('#FFFF00');
    expect(typeof result.calculatedAt).toBe('string');
  });
});