import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Error Handling', () => {
  // SCEN-915
  test('should throw error when createdAt is undefined during priority score calculation', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-alpha',
    };

    // Create a malformed report object with undefined createdAt
    const malformedReport = {
      ...input,
      createdAt: undefined,
    };

    expect(() => {
      calculateIssuePriorityScore(malformedReport as any);
    }).toThrow(/createdAt/i);
  });
});