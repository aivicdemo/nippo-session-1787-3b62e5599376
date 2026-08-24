import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  // SCEN-2951
  test("発生頻度が高く波及度も高い課題は高スコアが算出される", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "ネットワーク障害",
      occurrenceFrequency: 10,
      impactScore: 85,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-001"
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.priorityScore).toBeGreaterThanOrEqual(80);
    expect(result.priorityScore).toBeLessThanOrEqual(95);
    expect(result.issueId).toBe("issue-001");
    expect(result.priorityRank).toBe("高");
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe("#FF0000");
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe("string");
  });
});