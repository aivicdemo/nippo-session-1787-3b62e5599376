import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Priority Score Validation', () => {
  test('SCEN-1145: should throw ValidationError when priorityScore is negative', () => {
    const invalidIssueData = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      extractedIssues: [
        {
          keywordId: 'keyword-001',
          keyword: 'database-timeout',
          frequency: 3,
          priorityScore: -5,
          impactScore: 75
        }
      ]
    };

    expect(() => {
      extractAndRankIssueKeywords(invalidIssueData);
    }).toThrow(/優先度スコアは0以上100以下/);
  });
});