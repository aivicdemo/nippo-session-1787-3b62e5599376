import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア計算機能", () => {
  test("SCEN-641: 過去30日間の発生履歴の開始日が計測対象期間に含まれる", () => {
    const currentDate = new Date("2024-06-15T09:00:00Z");
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const input = {
      issueId: "issue-001",
      issueContent: "API レスポンスタイムアウトの問題が発生している",
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: currentDate.toISOString(),
      teamId: "team-001",
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe("issue-001");
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(
      0
    );
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(
      20
    );
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getTime()).toBeGreaterThan(
      thirtyDaysAgo.getTime()
    );
    expect(calculatedDate.getTime()).toBeLessThanOrEqual(
      currentDate.getTime() + 1000
    );
  });
});