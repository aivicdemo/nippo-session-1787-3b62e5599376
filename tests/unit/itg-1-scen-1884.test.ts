import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  // SCEN-1884
  test("should return 400 Bad Request error when endDate is not provided", () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: undefined as any,
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/終了日/);
  });
});