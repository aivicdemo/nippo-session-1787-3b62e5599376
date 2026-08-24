import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-2955: [normal] 課題優先度スコア算出機能 - 同じ入力で2回実行した場合、同じスコアが返される
  test("同じ入力で2回実行した場合、同じスコアが返される", () => {
    const testInput = {
      issueId: "issue-001",
      issueContent: "APIレスポンスタイムアウト問題が本番環境で複数回発生",
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:30:00Z",
      teamId: "team-dev-001",
    };

    const firstExecutionResult = calculateIssuePriorityScore(testInput);
    const secondExecutionResult = calculateIssuePriorityScore(testInput);

    expect(firstExecutionResult.issueId).toBe("issue-001");
    expect(secondExecutionResult.issueId).toBe("issue-001");
    expect(firstExecutionResult.priorityScore).toBe(
      secondExecutionResult.priorityScore
    );
    expect(firstExecutionResult.priorityRank).toBe(
      secondExecutionResult.priorityRank
    );
    expect(firstExecutionResult.scoreBreakdown.frequencyScore).toBe(
      secondExecutionResult.scoreBreakdown.frequencyScore
    );
    expect(firstExecutionResult.scoreBreakdown.impactScore).toBe(
      secondExecutionResult.scoreBreakdown.impactScore
    );
    expect(firstExecutionResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondExecutionResult.scoreBreakdown.resolutionDifficultyScore
    );
    expect(firstExecutionResult.colorCode).toBe(secondExecutionResult.colorCode);
  });
});