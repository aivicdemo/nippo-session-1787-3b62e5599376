import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-836: extractAndRankIssueKeywords throws error when reportId is 0', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput = {
      reportId: 0,
      teamId: 'team-001',
      reportContent: 'データベース接続エラーが発生した。キャッシュの同期に遅延が生じている。',
      adapter: mockTextAnalysisServiceAdapter,
    };

    await expect(async () => {
      await extractAndRankIssueKeywords(invalidInput);
    }).rejects.toThrow(/日報ID/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});