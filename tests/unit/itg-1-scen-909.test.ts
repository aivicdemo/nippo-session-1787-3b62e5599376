import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-909
  test('チーム波及度スコアが null のとき影響度判定が失敗し例外をスロー', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 5,
      impactScore: null,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-alpha',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/チーム波及度スコア/);
  });
});