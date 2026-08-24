import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2925
  test('朝会報告データが null のとき、処理を中断してエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      reportingData: null,
      adapter: mockTextAnalysisServiceAdapter,
    };

    const result = extractAndRankIssueKeywords(input);

    expect(result.status).toBe(400);
    expect(result.errorMessage).toBe('朝会報告データが無効です。処理を中止しました');
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});