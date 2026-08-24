import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-1346: [edge] 課題影響度判定機能 - 課題の影響度スコアがちょうど中優先度の閾値（例：40点）で中優先度に判定される
  test("should assign medium priority rank when priority score equals medium threshold of 40", () => {
    const input = {
      issueId: "ISS-001",
      issueContent: "Test issue content",
      occurrenceFrequency: 5,
      impactScore: 40,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: "2024-01-15",
      teamId: "TEAM-001",
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe("ISS-001");
    expect(result.priorityScore).toBe(40);
    expect(result.priorityRank).toBe("中");
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBeDefined();
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeDefined();
    expect(result.colorCode).toBe("#FFFF00");
    expect(result.calculatedAt).toBeDefined();
  });
});