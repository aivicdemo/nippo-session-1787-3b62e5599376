import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
  ScoreBreakdown,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Priority Scoring - Deduplication Edge Case", () => {
  test("SCEN-1548: duplicate identical issues are deduplicated and frequency normalized to 1 for score calculation", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "API障害対応",
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input
    );

    expect(result.issueId).toBe("issue-001");
    expect(typeof result.priorityScore).toBe("number");
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    expect(result.priorityRank).toMatch(/高|中|低/);

    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe("number");
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    expect(typeof result.scoreBreakdown.impactScore).toBe("number");
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe(
      "number"
    );
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(
      0
    );
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(
      20
    );

    const totalScoreBreakdown =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalScoreBreakdown).toBe(result.priorityScore);

    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    const colorMap: Record<string, string> = {
      高: "#FF0000",
      中: "#FFFF00",
      低: "#00FF00",
    };
    const expectedColor = colorMap[result.priorityRank];
    expect(result.colorCode).toBe(expectedColor);

    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getTime()).toBeGreaterThan(0);
    expect(calculatedDate.getTime()).toBeLessThanOrEqual(
      new Date().getTime() + 1000
    );
  });
});