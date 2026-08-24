import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import { type IssuePriorityScoringInput } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア算出機能", () => {
  // SCEN-802
  test("[error] 過去7日間の集計期間が負の数のとき処理が中断される", () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "データベース接続エラーが頻発している",
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: -7,
      reportingDate: "2024-01-15",
      teamId: "team-dev-001",
    };

    expect(() => {
      calculateIssuePriorityScore(invalidInput);
    }).toThrow(/集計期間|正の整数/);
  });
});