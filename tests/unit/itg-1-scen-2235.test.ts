import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-2235
  test('should return error when input reports array is empty', () => {
    const emptyReports: Array<{ content: string }> = [];
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = extractAndRankIssueKeywords(
      {
        reports: emptyReports,
        startDate,
        endDate,
        teamId,
        requestUserId,
        minFrequencyThreshold: 1,
      },
      mockTextAnalysisAdapter
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toContain('入力日報配列が空です');
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});