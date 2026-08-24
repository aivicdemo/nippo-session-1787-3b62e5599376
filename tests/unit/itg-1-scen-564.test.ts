import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア計算", () => {
  // SCEN-564: [normal] 課題優先度判定機能 - チーム全体への波及度が高い課題は高い影響度スコアとして計算される

  let mockTextAnalysisAdapter: {
    assessImpactScore: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn(),
    };
  });

  test("複数チームメンバーから報告された課題は高い影響度スコアで優先度が計算される", () => {
    const issueId = "issue-001-server-down";
    const issueContent = "サーバーダウンが発生し、サービス全体が停止";
    const occurrenceFrequency = 5;
    const affectedTeamCount = 5;
    const resolutionDaysAverage = 2;
    const reportingDate = "2024-01-15T09:00:00Z";
    const teamId = "team-dev-001";

    mockTextAnalysisAdapter.assessImpactScore.mockReturnValue(75);

    const input: IssuePriorityScoringInput = {
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore: 0,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input,
      mockTextAnalysisAdapter
    );

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      issueContent,
      affectedTeamCount
    );

    expect(result.issueId).toBe(issueId);
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toBe("高");

    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(result.colorCode).toBe("#FF0000");

    expect(result.calculatedAt).toBeDefined();
    const calculatedAtDate = new Date(result.calculatedAt);
    expect(calculatedAtDate.getTime()).toBeCloseTo(
      new Date("2024-01-15T09:00:00Z").getTime(),
      -3
    );
  });
});