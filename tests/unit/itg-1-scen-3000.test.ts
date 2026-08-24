import { calculateIssuePriorityScore, type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  test('SCEN-3000: 課題テキストが null のとき、影響度判定がエラーになる', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: null as any,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/課題テキスト|入力値/);
  });
});