import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  test('SCEN-624: should throw ValidationError when impact score is negative', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 3,
      impactScore: -5,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-engineering',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/影響度スコア/);
    
    try {
      calculateIssuePriorityScore(input);
    } catch (error: unknown) {
      if (error instanceof Error && 'errorcode' in error) {
        expect((error as any).errorcode).toBe('INVALID_IMPACT_SCORE');
      }
    }
  });
});