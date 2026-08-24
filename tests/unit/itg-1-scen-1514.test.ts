import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  // SCEN-1514: [normal] 課題優先度スコア算出機能 - 発生頻度が低く影響度が低い課題は優先度ランク「低」に分類される
  test("発生頻度20・影響度15の課題は優先度ランク「低」に分類される", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "低頻度・低影響課題",
      occurrenceFrequency: 2,
      impactScore: 15,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input
    );

    expect(result.issueId).toBe("issue-001");
    expect(result.priorityRank).toBe("低");
    expect(result.priorityScore).toBeLessThan(40);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(
      20
    );
    expect(result.colorCode).toBe("#00FF00");
    expect(result.calculatedAt).toBeTruthy();
    expect(typeof result.calculatedAt).toBe("string");
  });
});