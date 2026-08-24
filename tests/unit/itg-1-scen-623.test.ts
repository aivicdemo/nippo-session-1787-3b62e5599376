import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-623
  test('過去30日間の課題発生履歴データが空オブジェクトのとき例外を発生させる', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'テスト課題の内容',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const emptyHistoryData = {};

    expect(() =>
      calculateIssuePriorityScore(input, emptyHistoryData as any)
    ).toThrow(/課題発生履歴データが空/);
  });
});