import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Priority Score Calculation - Error Handling", () => {
  test("SCEN-942: calculateIssuePriorityScore throws error when impact score is undefined", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "重要な問題が発生している",
      occurrenceFrequency: 5,
      impactScore: undefined as unknown as number,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team-001",
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(
      /優先度スコア|Priority score|定義/i
    );
  });
});