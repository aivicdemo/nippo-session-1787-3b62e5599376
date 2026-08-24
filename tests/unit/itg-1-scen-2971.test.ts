import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Team Impact Score Validation', () => {
  // SCEN-2971
  test('should throw error when team impact score is empty string', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: '' as unknown as number,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'team-alpha',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/チーム波及度|team impact|number|Invalid/i);
  });
});