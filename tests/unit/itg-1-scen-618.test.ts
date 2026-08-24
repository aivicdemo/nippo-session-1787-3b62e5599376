import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  test('SCEN-618: 日報テキストが null のとき例外を発生させる', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() =>
      calculateIssuePriorityScore(null as any, input)
    ).toThrow(/日報テキスト/);
  });
});