import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Null Keywords Error Handling', () => {
  test('SCEN-904: should throw an exception when keywords array is null', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => calculateIssuePriorityScore(input, null as any)).toThrow(/keywords/i);
  });
});