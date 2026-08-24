import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Priority Scoring - Impact Degree Classification", () => {
  // SCEN-2794: [edge] 課題影響度判定・波及度スコア計算機能 - チーム波及度スコアが中影響度閾値（50）の課題が中影響と判定される
  test("should classify issue with impact score 50 as medium severity", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "Database connection timeout on production",
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-alpha",
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe("issue-001");
    expect(result.priorityScore).toBe(50);
    expect(result.priorityRank).toBe("中");
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(20);
    expect(result.colorCode).toBe("#FFFF00");
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});