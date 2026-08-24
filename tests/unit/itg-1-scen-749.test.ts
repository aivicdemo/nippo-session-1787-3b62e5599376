import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  test('SCEN-749: 集約日報データが空配列のとき、エラーを返す', () => {
    // Arrange: モック TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 入力データ: 空の集約日報配列
    const emptyReports: any[] = [];

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert: エラーをスロー、またはエラーレスポンスを返す
    expect(() =>
      extractAndRankIssueKeywords(
        emptyReports,
        input,
        mockTextAnalysisAdapter
      )
    ).toThrow(/入力データが空|日報データが必要/);

    // 外部 API が呼び出されていないことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});