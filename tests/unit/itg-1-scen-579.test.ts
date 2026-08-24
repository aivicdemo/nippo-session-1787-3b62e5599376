import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-579
  test('should throw ValidationError when reporterId is null', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: '本番環境でデータベース接続タイムアウトが頻発している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
      reporterId: null,
    };

    expect(() => calculateIssuePriorityScore(input as any)).toThrow(/報告者ID|reporterId/);
  });
});