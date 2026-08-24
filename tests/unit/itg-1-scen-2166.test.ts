import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-2166
  test('開始日が終了日より後のとき、エラーが発生する', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'テストサーバーのメモリリーク',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2026-08-20',
      teamId: 'team-dev-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/日付/);
  });
});