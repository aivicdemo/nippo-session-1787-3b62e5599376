import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-2246
  test('should throw error when normalized reports do not consist of single team only', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-a',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() => {
      extractAndRankIssueKeywords(input);
    }).toThrow(/同一チーム/);
  });
});