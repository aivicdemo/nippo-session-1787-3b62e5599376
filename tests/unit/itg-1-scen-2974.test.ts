import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能 - チーム波及度スコアバリデーション', () => {
  test('SCEN-2974: チーム波及度スコアが負の値のとき、優先度スコア計算がエラーになる', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: 5,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A'
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/チーム波及度スコア/);
  });
});