import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算機能', () => {
  // SCEN-2967
  test('課題発生頻度が null のとき、優先度スコア計算がエラーになる', () => {
    const testInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: null as unknown as number,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(testInput)).toThrow(/発生頻度/);
  });
});