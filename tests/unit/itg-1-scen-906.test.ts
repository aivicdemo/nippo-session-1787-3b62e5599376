import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  // SCEN-906
  test('should throw an error when occurrence frequency is null', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: null as any,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/occurrence|null/i);
  });
});