import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Zero Frequency Error Handling', () => {
  test('SCEN-2969: calculateIssuePriorityScore throws error when occurrence frequency is zero', () => {
    const invalidInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 0,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-alpha',
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/frequency/i);
  });
});