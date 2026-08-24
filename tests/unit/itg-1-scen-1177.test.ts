import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-1177
  test('should throw error when report text is null', async () => {
    const input = {
      reportText: null as unknown as string,
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15T09:00:00Z'),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/日報テキスト/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});