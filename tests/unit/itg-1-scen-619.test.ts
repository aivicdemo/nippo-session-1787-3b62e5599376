import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア計算機能", () => {
  // SCEN-619
  test("日報テキストが空文字列のとき例外を発生させる", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "",
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/日報テキスト/);
  });
});