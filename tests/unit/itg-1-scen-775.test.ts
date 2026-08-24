import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from "../../src/logic/issue-extraction-prioritization";

describe("課題の優先度スコア算出機能", () => {
  // SCEN-775
  test("[edge] 同一課題の発生頻度が閾値未満のとき、重複排除後も独立の課題として扱われる", () => {
    const input1: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "DB接続エラーが発生しています",
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: "2024-01-15T08:30:00Z",
      teamId: "team-alpha"
    };

    const input2: IssuePriorityScoringInput = {
      issueId: "issue-002",
      issueContent: "DB接続エラーの問題が継続",
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: "2024-01-15T09:15:00Z",
      teamId: "team-alpha"
    };

    const output1: IssuePriorityScoringOutput = calculateIssuePriorityScore(input1);
    const output2: IssuePriorityScoringOutput = calculateIssuePriorityScore(input2);

    expect(output1.issueId).toBe("issue-001");
    expect(output2.issueId).toBe("issue-002");

    expect(typeof output1.priorityScore).toBe("number");
    expect(output1.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output1.priorityScore).toBeLessThanOrEqual(100);

    expect(typeof output2.priorityScore).toBe("number");
    expect(output2.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output2.priorityScore).toBeLessThanOrEqual(100);

    expect(output1.priorityRank).toMatch(/^(高|中|低)$/);
    expect(output2.priorityRank).toMatch(/^(高|中|低)$/);

    expect(output1.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(output1.scoreBreakdown).toHaveProperty("impactScore");
    expect(output1.scoreBreakdown).toHaveProperty("resolutionDifficultyScore");

    expect(output1.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(output1.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(output1.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(output1.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(output1.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(output1.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(output2.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(output2.scoreBreakdown).toHaveProperty("impactScore");
    expect(output2.scoreBreakdown).toHaveProperty("resolutionDifficultyScore");

    expect(output1.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(output2.colorCode).toMatch(/^#[0-9A-F]{6}$/i);

    expect(output1.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(output2.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});