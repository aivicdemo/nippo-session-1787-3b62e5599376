import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・頻度ランク付け機能", () => {
  test("SCEN-2926: 朝会報告データが空配列のとき、エラーを返す", () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを作成
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 空配列として朝会報告データを準備
    const emptyReports: any[] = [];

    // 入力パラメータを構築
    const input = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    // Act & Assert: 関数が呼び出されて、適切なエラーを返すことを検証
    expect(() =>
      extractAndRankIssueKeywords(
        emptyReports,
        input,
        mockTextAnalysisServiceAdapter
      )
    ).toThrow(/朝会報告データが空|ERR_EMPTY_REPORT_DATA/);

    // TextAnalysisServiceAdapter の extractKeywords メソッドが呼び出されないことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});