import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定・優先度スコア付与', () => {
  test('SCEN-844: 課題テキストがnullで渡されたときエラーになる', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: null as unknown as string,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/課題テキスト/);
  });
});