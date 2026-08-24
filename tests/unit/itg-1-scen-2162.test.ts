import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア', () => {
  // SCEN-2162
  test('発生頻度カウントが0のとき、エラーが発生する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 0,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/発生頻度/);
  });
});