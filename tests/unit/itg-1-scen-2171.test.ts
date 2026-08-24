import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア', () => {
  // SCEN-2171
  test('対象チームが空配列のとき、エラーが発生する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 0,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: '',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/チーム/);
  });
});