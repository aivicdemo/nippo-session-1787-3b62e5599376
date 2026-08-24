import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-3012: [edge] 課題優先度スコア自動計算機能 - チーム波及度スコアが閾値超過（例：51点）のときスコアが上限側で計算される
  test('チーム波及度スコアが51点（閾値50点超過）のとき、最終優先度スコアが100点で固定される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーのメモリ使用率が90%に達している',
      occurrenceFrequency: 5,
      impactScore: 51,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(typeof result.calculatedAt).toBe('string');
  });
});