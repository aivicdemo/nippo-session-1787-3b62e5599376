import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Impact Score Validation', () => {
  test('SCEN-498: extractAndRankIssueKeywords should throw error when impact score is negative', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'database connection timeout', frequency: 2 },
          { keyword: 'feature A implementation', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockReturnValue(-5),
      classifyIssueSeverity: jest.fn().mockReturnValue('high')
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const reportText = 'Yesterday I implemented feature A. Today I will test feature B. We have a database connection timeout issue.';

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, reportText);
    }).toThrow(/Impact score/);
  });
});