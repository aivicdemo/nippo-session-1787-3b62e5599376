import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  // SCEN-1299: [normal] 課題影響度判定機能 - 波及度スコア100で影響度が最高と判定される
  test("should calculate priority score with maximum impact level when wave spread score is 100", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "Critical system failure affecting all teams",
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 10,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-001"
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe("issue-001");
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe("高");
    expect(result.scoreBreakdown.frequencyScore).toBe(25);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(20);
    expect(result.colorCode).toBe("#FF0000");
    expect(typeof result.calculatedAt).toBe("string");
  });
});