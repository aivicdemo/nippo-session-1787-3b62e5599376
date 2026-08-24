import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Keyword Validation', () => {
  // SCEN-1137
  test('should return validation error when keyword is empty string', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '', frequency: 5 },
          { keyword: 'database_performance', frequency: 3 },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toMatch(/INVALID_KEYWORD_EMPTY/);
    expect(result).toHaveProperty('failedField', 'keyword');
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});