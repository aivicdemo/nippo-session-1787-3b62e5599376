import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

// SCEN-798
describe('課題の影響度判定と優先度スコア算出', () => {
  test('should throw error when issue content is null', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: null as any,
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-A'
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/content/i);
  });
});