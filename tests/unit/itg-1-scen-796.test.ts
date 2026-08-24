import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与機能', () => {
  // SCEN-796
  test('[error] 課題優先度スコア算出機能 - 過去7日間の課題発生頻度データが null のとき処理が中断される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: null,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-alpha',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/頻度データ|過去7日間|無効/);
  });
});