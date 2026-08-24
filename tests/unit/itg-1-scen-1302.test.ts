import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア付与", () => {
  // SCEN-1302
  test("単一の課題から影響度スコアが1件返される", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const issueInput = {
      issueId: "ISSUE-001",
      issueContent: "データベース接続エラー",
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: "2026-08-19T09:00:00Z",
      teamId: "TEAM-001",
    };

    const expectedTimestamp = new Date("2026-08-19T12:34:56.000Z");

    const result = calculateIssuePriorityScore(
      issueInput,
      mockTextAnalysisServiceAdapter
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("issueId", "ISSUE-001");
    expect(result[0]).toHaveProperty("impactScore");
    expect(typeof result[0].impactScore).toBe("number");
    expect(result[0].impactScore).toBeGreaterThanOrEqual(0);
    expect(result[0].impactScore).toBeLessThanOrEqual(100);
    expect(result[0]).toHaveProperty("assessmentTimestamp");
    expect(typeof result[0].assessmentTimestamp).toBe("string");
  });
});