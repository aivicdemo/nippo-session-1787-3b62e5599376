import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-2382: [edge] 課題影響度スコアの算出 - チーム波及度スコアが下限値0に到達したとき、0を下回らない値として記録する
  test("should record impact score as 0 when impact score reaches minimum threshold of 0", () => {
    const mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn().mockReturnValue(0),
    };

    const input: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: "issue-001",
      issueContent: "システム障害が発生",
      occurrenceFrequency: 3,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(Number.isFinite(result.priorityScore)).toBe(true);
  });
});