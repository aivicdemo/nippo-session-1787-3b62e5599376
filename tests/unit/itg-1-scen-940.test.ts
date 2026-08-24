import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア計算", () => {
  test("SCEN-940: 課題の配列が空配列のとき処理を中断しエラーを返す", () => {
    // Arrange
    const emptyIssuesArray: any[] = [];
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Act
    const result = calculateIssuePriorityScore(
      emptyIssuesArray,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result).toEqual({
      code: "EMPTY_ISSUES_ARRAY",
      message: "課題配列が空です。スコア計算を実行できません。",
    });
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});