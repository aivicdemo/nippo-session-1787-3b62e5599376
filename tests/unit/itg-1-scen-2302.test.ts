import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2302: [edge] 課題影響度判定機能 - チーム波及度スコアが 0 未満の無効値の場合、処理が適切に判定される
  test('チーム波及度スコアが0未満の無効値の場合、エラーハンドリングが実行され、入力値は無効と検出される', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース障害',
      occurrenceFrequency: 5,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-alpha'
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/INVALID_SCORE_RANGE/);
  });
});