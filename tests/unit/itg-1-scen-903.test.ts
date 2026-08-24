import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - calculateIssuePriorityScore', () => {
  // SCEN-903
  test('should throw error when extracted keywords array is empty', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
      extractedKeywords: [],
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/キーワード|キーワード配列|抽出キーワード/);
  });
});