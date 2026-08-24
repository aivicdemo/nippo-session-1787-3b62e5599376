import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  // SCEN-622: [error] 課題優先度スコア計算機能 - 過去30日間の課題発生履歴データが null のとき例外を発生させる
  test('過去30日間の課題発生履歴データが null のとき TypeError を発生させる', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: null as any,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/履歴データ|historyData|null/);
  });
});