import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1498
  test('抽出されたキーワードが空配列のとき、エラーを返す', () => {
    // 準備: TextAnalysisServiceAdapterのスタブを作成
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText = '昨日は機能開発を実施。今日は結合テストを予定。課題は特になし。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-001';

    // 実行とアサーション
    expect(() =>
      extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold: 1,
          requestUserId,
        },
        mockTextAnalysisService
      )
    ).toThrow(/キーワード/);

    // assessImpactScore は呼ばれないことを確認
    expect(mockTextAnalysisService.assessImpactScore).not.toHaveBeenCalled();
  });
});