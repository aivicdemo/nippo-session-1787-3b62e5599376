import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2956
  test('TextAnalysisServiceAdapterが正常応答したとき、抽出されたキーワードと発生頻度が返される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続', frequency: 3 },
          { keyword: 'API応答遅延', frequency: 2 },
          { keyword: 'メモリリーク', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText =
      'データベース接続のタイムアウトが発生。データベース接続を再確認。API応答遅延も観測。API応答遅延の原因調査中。メモリリークの可能性あり。';

    const result = extractAndRankIssueKeywords(reportText, mockTextAnalysisAdapter);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(reportText);
    expect(result).toEqual({
      keywords: [
        { keyword: 'データベース接続', frequency: 3 },
        { keyword: 'API応答遅延', frequency: 2 },
        { keyword: 'メモリリーク', frequency: 1 },
      ],
    });
  });
});