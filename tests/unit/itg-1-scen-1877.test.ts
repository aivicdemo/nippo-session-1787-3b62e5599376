import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Ranking", () => {
  // SCEN-1877
  test("should return empty result when no issues match the search criteria within the specified date range", async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-01-31T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(input);

    expect(result.keywords).toEqual([]);
    expect(result.totalKeywordCount).toBe(0);
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(31);
  });
});