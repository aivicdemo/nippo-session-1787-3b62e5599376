import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Null Keyword Error Handling', () => {
  test('SCEN-946: calculateIssuePriorityScore throws KeywordNullError when keyword is null', () => {
    const invalidInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
      keyword: null as any,
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/KeywordNullError|キーワード.*null/);
  });
});