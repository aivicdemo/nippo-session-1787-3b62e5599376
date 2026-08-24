import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-928: [edge] 課題優先度スコア算出機能 - 複数課題の優先度スコアが同値のとき、同順位で表示される
  test("SCEN-928: 複数課題の優先度スコアが同値のときに、同順位で表示される", () => {
    const input_a: IssuePriorityScoringInput = {
      issueId: "issue-a",
      issueContent: "Database connection timeout in production",
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team-001",
    };

    const input_b: IssuePriorityScoringInput = {
      issueId: "issue-b",
      issueContent: "API response delay under heavy load",
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team-001",
    };

    const input_c: IssuePriorityScoringInput = {
      issueId: "issue-c",
      issueContent: "Minor UI alignment issue",
      occurrenceFrequency: 2,
      impactScore: 20,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team-001",
    };

    const output_a: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input_a
    );
    const output_b: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input_b
    );
    const output_c: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input_c
    );

    expect(output_a.priorityScore).toBe(65);
    expect(output_b.priorityScore).toBe(65);
    expect(output_c.priorityScore).toBe(45);

    expect(output_a.priorityRank).toBe("高");
    expect(output_b.priorityRank).toBe("高");
    expect(output_c.priorityRank).toBe("中");

    expect(output_a.colorCode).toBe("#FF0000");
    expect(output_b.colorCode).toBe("#FF0000");
    expect(output_c.colorCode).toBe("#FFFF00");

    expect(output_a.scoreBreakdown.frequencyScore).toBe(16);
    expect(output_a.scoreBreakdown.impactScore).toBe(32);
    expect(output_a.scoreBreakdown.resolutionDifficultyScore).toBe(17);

    expect(output_b.scoreBreakdown.frequencyScore).toBe(16);
    expect(output_b.scoreBreakdown.impactScore).toBe(32);
    expect(output_b.scoreBreakdown.resolutionDifficultyScore).toBe(17);

    expect(output_c.scoreBreakdown.frequencyScore).toBe(8);
    expect(output_c.scoreBreakdown.impactScore).toBe(8);
    expect(output_c.scoreBreakdown.resolutionDifficultyScore).toBe(10);

    expect(output_a.issueId).toBe("issue-a");
    expect(output_b.issueId).toBe("issue-b");
    expect(output_c.issueId).toBe("issue-c");

    const timestamp_a = new Date(output_a.calculatedAt);
    const timestamp_b = new Date(output_b.calculatedAt);
    const timestamp_c = new Date(output_c.calculatedAt);

    expect(timestamp_a instanceof Date && !isNaN(timestamp_a.getTime())).toBe(
      true
    );
    expect(timestamp_b instanceof Date && !isNaN(timestamp_b.getTime())).toBe(
      true
    );
    expect(timestamp_c instanceof Date && !isNaN(timestamp_c.getTime())).toBe(
      true
    );
  });
});