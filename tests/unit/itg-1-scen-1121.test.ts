import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-1121: [normal] 抽出課題データの不完全性検出機能 - 課題テキストが空文字列の場合、不完全として判定される
  test('should detect incomplete issue data when issueText is empty string', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const emptyIssueText = '';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');

    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId: 'user-001',
      },
      mockTextAnalysisServiceAdapter
    );

    expect(result.isIncomplete).toBe(true);
    expect(result.isIncompleteReason).toBe('課題テキストが入力されていません');
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});