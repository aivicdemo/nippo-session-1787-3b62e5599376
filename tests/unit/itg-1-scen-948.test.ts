import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-948: [error] 課題優先度スコア計算・色分け表示機能 - 影響度スコアが null のとき優先度スコア計算がエラーを返す
  test('影響度スコアが null のとき優先度スコア計算がエラーを返す', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが間欠的に発生',
      occurrenceFrequency: 5,
      impactScore: null as any,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toHaveProperty('type', 'INVALID_IMPACT_SCORE');
    expect(result).toHaveProperty('message', '影響度スコアがnullです。計算処理を中止します');
    expect(result).toEqual({
      type: 'INVALID_IMPACT_SCORE',
      message: '影響度スコアがnullです。計算処理を中止します',
    });
  });
});