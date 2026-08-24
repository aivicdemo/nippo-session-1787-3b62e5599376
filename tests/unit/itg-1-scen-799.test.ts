import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("calculateIssuePriorityScore - empty report text error handling", () => {
  test("SCEN-799: should throw error when report text is empty string", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "Database connection timeout",
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: "2024-01-15",
      teamId: "team-001",
    };

    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest
        .fn()
        .mockRejectedValue(new Error("日報テキストが入力されていません")),
      classifyIssueSeverity: jest.fn().mockResolvedValue("高"),
    };

    expect(() =>
      calculateIssuePriorityScore(input, stubTextAnalysisServiceAdapter)
    ).toThrow(/日報テキスト/);
  });
});