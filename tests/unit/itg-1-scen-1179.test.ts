import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-1179
  test('should throw validation error when report ID is null', async () => {
    const invalidInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const extractKeywordsInput = {
      reportId: null,
      text: 'sample report content',
    };

    expect(async () => {
      await extractAndRankIssueKeywords(
        invalidInput,
        mockTextAnalysisServiceAdapter
      );
    }).rejects.toThrow(/日報ID|report.*ID/i);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});