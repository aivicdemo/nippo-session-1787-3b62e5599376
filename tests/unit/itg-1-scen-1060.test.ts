import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアリング', () => {
  // SCEN-1060: [error] 課題影響度判定機能 - チーム波及度スコアが 0 未満のとき、優先度スコア算出がエラーになる
  test('チーム波及度スコアが負値のとき、INVALID_TEAM_WAVE_SCOREエラーをスロー', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システム障害',
      occurrenceFrequency: 5,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/INVALID_TEAM_WAVE_SCORE/);
  });
});