import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-2158
  test('チーム波及度スコアが null のときエラーが発生する', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'システム障害',
      occurrenceFrequency: 5,
      impactScore: null as any,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-A',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/波及度スコア/);
  });
});