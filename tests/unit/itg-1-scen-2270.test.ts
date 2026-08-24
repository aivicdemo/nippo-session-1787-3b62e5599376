import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  test("SCEN-2270: 抽出されたキーワードが1件の場合、そのキーワードのチーム波及度スコアが算出される", () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを作成
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["データベース接続エラー"],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(45),
      classifyIssueSeverity: jest.fn(),
    };

    // テスト入力データ
    const issuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "データベース接続エラーが発生している",
      occurrenceFrequency: 1,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team-001",
    };

    // Act: calculateIssuePriorityScore を呼び出す
    const result = calculateIssuePriorityScore(
      issuePriorityScoringInput,
      mockTextAnalysisAdapter
    );

    // Assert: assessImpactScore が正確に1回呼び出されたか確認
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      "データベース接続エラー"
    );

    // Assert: 戻り値が正しい型で返却されたか確認
    expect(typeof result.priorityScore).toBe("number");

    // Assert: チーム波及度スコアが0～100の範囲内であることを確認
    expect(result.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.impactScore).toBeLessThanOrEqual(100);

    // Assert: 戻り値に期待されるフィールドが含まれていることを確認
    expect(result).toHaveProperty("issueId", "issue-001");
    expect(result).toHaveProperty("priorityScore");
    expect(result).toHaveProperty("priorityRank");
    expect(result).toHaveProperty("scoreBreakdown");
    expect(result).toHaveProperty("colorCode");
    expect(result).toHaveProperty("calculatedAt");

    // Assert: scoreBreakdown が期待通りの構造を持っていることを確認
    expect(result.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(result.scoreBreakdown).toHaveProperty("impactScore");
    expect(result.scoreBreakdown).toHaveProperty("resolutionDifficultyScore");

    // Assert: 各スコアが期待される範囲内であることを確認
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(
      0
    );
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Assert: priorityScore が各スコアの合計と一致することを確認
    const expectedTotalScore =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(result.priorityScore).toBe(expectedTotalScore);

    // Assert: priorityRank が正しく判定されていることを確認
    expect(["高", "中", "低"]).toContain(result.priorityRank);

    // Assert: colorCode が有効な色コードであることを確認
    expect(["#FF0000", "#FFFF00", "#00FF00"]).toContain(result.colorCode);

    // Assert: calculatedAt が ISO 8601 形式の日時文字列であることを確認
    expect(typeof result.calculatedAt).toBe("string");
    expect(new Date(result.calculatedAt).toISOString()).toBe(
      result.calculatedAt
    );
  });
});