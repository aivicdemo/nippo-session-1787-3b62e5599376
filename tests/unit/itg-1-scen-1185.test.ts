import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  // SCEN-1185
  test("should handle negative frequency values from TextAnalysisServiceAdapter with proper error handling", async () => {
    // Setup: Mock TextAnalysisServiceAdapter with negative frequency
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "接続エラー",
            frequency: -5,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    // Execute: Call extractAndRankIssueKeywords with mocked adapter
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Assert: Verify error handling behavior
    // (1) Error detection for negative frequency
    expect(result).toBeDefined();
    expect(result.keywords).toEqual([]);

    // (2) Verify error status in response
    expect(result.extractedAt).toBeDefined();
    expect(result.totalKeywordCount).toBe(0);
    expect(result.analysisperiodDays).toBe(7);

    // (3) Verify adapter was called
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith({
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
    });

    // (4) Verify no invalid keywords are returned
    const hasNegativeFrequency = result.keywords.some(
      (kw) => kw.frequency < 0
    );
    expect(hasNegativeFrequency).toBe(false);

    // (5) Verify filtering of negative frequency values
    expect(result.keywords.length).toBe(0);
  });
});