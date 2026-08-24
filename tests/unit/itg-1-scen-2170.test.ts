import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Team Validation', () => {
  // SCEN-2170
  it('should throw ValidationError when teamId is not specified', () => {
    const invalidInput: Partial<IssuePriorityScoringInput> = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: undefined,
    };

    expect(() => {
      calculateIssuePriorityScore(invalidInput as IssuePriorityScoringInput);
    }).toThrow(/チーム|team|Team/i);
  });
});