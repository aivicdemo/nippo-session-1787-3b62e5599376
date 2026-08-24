import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-1526: calculateIssuePriorityScore throws error when impact score is below 0', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システムダウン',
      occurrenceFrequency: 5,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/チーム波及度スコア/);
  });
});