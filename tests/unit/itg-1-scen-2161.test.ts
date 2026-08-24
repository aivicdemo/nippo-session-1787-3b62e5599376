import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-2161: [error] 課題優先度スコア算出機能 - 発生頻度カウントが null のとき、エラーが発生する
  test('発生頻度カウントが null のとき、エラーが発生する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続が遅い',
      occurrenceFrequency: null as any,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/occurrenceFrequency|occurrenceCount|発生頻度/);
  });
});