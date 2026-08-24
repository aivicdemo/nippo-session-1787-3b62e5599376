import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与', () => {
  test('SCEN-588: 影響度スコアが文字列型のとき型エラーが発生する', () => {
    const issuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース障害',
      occurrenceFrequency: 5,
      impactScore: '85' as unknown as number,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => calculateIssuePriorityScore(issuePriorityScoringInput)).toThrow(
      /影響度スコアは数値型である必要があります/
    );
  });
});