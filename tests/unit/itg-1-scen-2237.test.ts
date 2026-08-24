import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Error Handling', () => {
  test('SCEN-2237: throws error when reportContent is empty string', () => {
    const invalidInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      reports: [
        {
          reportId: 'report-001',
          reportContent: '',
          reportDate: new Date('2024-01-10T09:00:00Z'),
          authorId: 'engineer-001',
        },
      ],
    };

    expect(() => {
      extractAndRankIssueKeywords(invalidInput);
    }).toThrow(/reportContent/);
  });
});