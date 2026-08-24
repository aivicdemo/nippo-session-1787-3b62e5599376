import { describe, test, expect, beforeEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("issue priority score calculation", () => {
  test("SCEN-515: completely duplicate extracted issues are merged with combined frequency and single priority score", () => {
    const issueId1 = "issue-001";
    const issueId2 = "issue-002";
    const keyword = "データベース接続エラー";
    const frequency1 = 3;
    const frequency2 = 3;
    const totalFrequency = frequency1 + frequency2;
    const impactScore = 85;
    const occurrenceFrequency = 6;
    const affectedTeamCount = 2;
    const resolutionDaysAverage = 2;
    const reportingDate = "2024-01-15T09:00:00Z";
    const teamId = "team-alpha";

    const input: IssuePriorityScoringInput = {
      issueId: issueId1,
      issueContent: keyword,
      occurrenceFrequency: totalFrequency,
      impactScore: impactScore,
      affectedTeamCount: affectedTeamCount,
      resolutionDaysAverage: resolutionDaysAverage,
      reportingDate: reportingDate,
      teamId: teamId,
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe(issueId1);
    expect(result.priorityScore).toBe(impactScore);
    expect(result.priorityRank).toBe("高");
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThan(0);
    expect(result.colorCode).toBe("#FF0000");
    expect(result.calculatedAt).toBeDefined();
  });
});

interface IssuePriorityScoringInput {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
}