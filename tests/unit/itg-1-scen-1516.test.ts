import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  test("SCEN-1516: 発生頻度が低く影響度が高い課題は優先度ランク「中」に分類される", () => {
    // Arrange: 発生頻度が低い（2回）、影響度スコアが高い（85）課題データを準備
    const input = {
      issueId: "issue-001",
      issueContent: "ネットワーク遅延",
      occurrenceFrequency: 2,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    // Act: 優先度スコア算出ロジックを実行
    const result = calculateIssuePriorityScore(input);

    // Assert: 優先度ランクが「中」であることを確認
    expect(result.priorityRank).toBe("中");

    // 優先度スコアが40以上70未満であることを確認（「中」の閾値）
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThan(70);

    // 色コードが黄色であることを確認（「中」優先度の色）
    expect(result.colorCode).toBe("#FFFF00");

    // スコア内訳が期待値であることを確認
    // 発生頻度スコア: 2回 → 低スコア（0～40で低めの値）
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(15);

    // 影響度スコア: 85 → 高スコア（0～40で高い値、85/100 * 40 = 34）
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(30);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    // 解決難度スコア: 平均2日 → スコア計算（0～20で中程度）
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 課題IDが一致することを確認
    expect(result.issueId).toBe("issue-001");

    // calculatedAtが ISO 8601形式の日時文字列であることを確認
    expect(result.calculatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});