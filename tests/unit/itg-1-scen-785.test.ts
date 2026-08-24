import { describe, it, expect, beforeEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Priority Score Calculation", () => {
  // SCEN-785: [normal] 課題優先度スコア算出機能 - 過去7日間に課題キーワードが1件の場合、発生頻度と本日の内容を組み合わせて優先度スコアが算出される
  it("should calculate priority score of 25 when keyword appears once in past 7 days with today occurrence and impact score of 50", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "APIタイムアウトが発生した",
      occurrenceFrequency: 1,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-dev-001",
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input
    );

    expect(result.issueId).toBe("issue-001");
    expect(result.priorityScore).toBe(25);
    expect(result.priorityRank).toBe("低");
    expect(result.scoreBreakdown.frequencyScore).toBe(6);
    expect(result.scoreBreakdown.impactScore).toBe(20);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(2);
    expect(result.colorCode).toBe("#00FF00");
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});