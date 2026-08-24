import { calculateIssuePriorityScore, type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-907
  test('チーム波及度スコアが0未満のとき影響度判定が失敗し例外をスローする', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'サーバーがダウンしている',
      occurrenceFrequency: 5,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'TEAM-A',
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/チーム波及度スコア/);
  });
});