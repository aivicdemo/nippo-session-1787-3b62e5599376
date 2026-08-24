import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - extractAndRankIssueKeywords', () => {
  // SCEN-2238
  test('should throw validation error when teamId is undefined', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };

    const reportWithUndefinedTeamId = {
      reportId: 'report-001',
      teamId: undefined,
      reportDate: new Date('2024-01-15T09:00:00Z'),
      challengeDescription: 'システム連携エラーが発生している',
    };

    const input = {
      teamId: undefined as any,
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/teamId/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});