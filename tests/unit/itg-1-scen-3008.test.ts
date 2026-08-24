import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-3008: [edge] 課題優先度スコア自動計算機能 - 課題発生頻度が閾値未満（例：4回）のときスコアが下限側で計算される
  test("課題発生頻度が閾値未満のときスコアが下限側で計算される", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "サーバーエラーが頻発している",
      occurrenceFrequency: 4,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toHaveProperty("issueId", "issue-001");
    expect(result).toHaveProperty("priorityScore");
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(30);
    expect(result).toHaveProperty("priorityRank", "低");
    expect(result).toHaveProperty("scoreBreakdown");
    expect(result.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(result.scoreBreakdown).toHaveProperty("impactScore");
    expect(result.scoreBreakdown).toHaveProperty("resolutionDifficultyScore");
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(10);
    expect(result).toHaveProperty("colorCode", "#00FF00");
    expect(result).toHaveProperty("calculatedAt");
  });
});