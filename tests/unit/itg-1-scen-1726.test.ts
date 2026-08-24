import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1726
  test('日報データ配列が null のとき抽出処理がエラーになる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() => {
      extractAndRankIssueKeywords(
        null as any,
        new Date('2024-01-08'),
        new Date('2024-01-14'),
        mockTextAnalysisAdapter,
        'team-001',
        1
      );
    }).toThrow(/日報データが未設定です/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});