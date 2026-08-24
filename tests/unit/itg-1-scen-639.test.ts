import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコアリング", () => {
  test("SCEN-639: 優先度スコアが1で最低優先度として判定される", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "ログイン画面のレスポンス遅延",
      occurrenceFrequency: 1,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe("issue-001");
    expect(result.priorityScore).toBe(1);
    expect(result.priorityRank).toBe("低");
    expect(result.colorCode).toBe("#00FF00");
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(1);
    expect(typeof result.calculatedAt).toBe("string");
  });
});