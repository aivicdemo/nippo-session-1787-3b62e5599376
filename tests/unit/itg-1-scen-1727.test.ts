import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-1727: extractAndRankIssueKeywords throws error when report data array is empty', () => {
    // Arrange
    const emptyReportData: any[] = [];
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Act & Assert
    expect(() =>
      extractAndRankIssueKeywords(emptyReportData, mockTextAnalysisAdapter)
    ).toThrow(/入力配列が空|日報データが不足|空の配列/);

    // Verify external API was not called
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});