import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  test('SCEN-847: calculateIssuePriorityScore returns structured error when teamId is null', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: null as any,
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: null,
      priorityRank: null,
      scoreBreakdown: null,
      colorCode: null,
      calculatedAt: expect.any(String),
      error: {
        code: 'INVALID_TEAM_ID',
        message: 'Team ID is required',
      },
    });
    expect(result.error?.code).toBe('INVALID_TEAM_ID');
    expect(result.error?.message).toBe('Team ID is required');
    expect(result.priorityScore).toBeNull();
    expect(result.scoreBreakdown).toBeNull();
  });
});