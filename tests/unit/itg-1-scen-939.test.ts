import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算・色分け表示機能', () => {
  // SCEN-939
  test('[error] 課題データが null のとき処理が進まずエラーを返す', () => {
    const invalidInput = {
      issueId: 'issue-001',
      issueContent: 'テストテーマ',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(null as any);
    }).toThrow(/課題データが不正です/);
  });
});