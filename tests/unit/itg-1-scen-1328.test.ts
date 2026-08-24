import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue extraction and ranking with external service fallback", () => {
  // SCEN-1328: TextAnalysisServiceAdapter.extractKeywords failure fallback to cache
  test("should return cached previous keywords when TextAnalysisServiceAdapter fails after max retries", async () => {
    const teamId = "team-001";
    const userId = "user-001";
    const startDate = new Date("2024-01-08T00:00:00Z");
    const endDate = new Date("2024-01-14T23:59:59Z");
    const minFrequencyThreshold = 1;

    // Mock TextAnalysisServiceAdapter that simulates API failure
    const mockAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error("API timeout after 30s")
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Mock cache/dictionary repository that returns previous successful results
    const mockCacheRepository = {
      getCachedKeywordsForTeam: jest.fn().mockResolvedValue({
        keywords: [
          {
            keywordId: "kw-001",
            keyword: "API連携エラー",
            frequency: 3,
            rank: 1,
          },
          {
            keywordId: "kw-002",
            keyword: "認証失敗",
            frequency: 2,
            rank: 2,
          },
        ],
        totalKeywordCount: 2,
        extractedAt: new Date("2024-01-07T09:30:00Z"),
        cacheSource: "fallback",
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId: userId,
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockAnalysisAdapter as any,
      mockCacheRepository as any
    );

    // Verify that API was called and failed (max 3 retries attempted)
    expect(mockAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // Verify that cache repository was consulted
    expect(mockCacheRepository.getCachedKeywordsForTeam).toHaveBeenCalledWith(
      teamId
    );

    // Verify the fallback result structure
    expect(result).toMatchObject({
      keywords: expect.arrayContaining([
        expect.objectContaining({
          keyword: "API連携エラー",
          frequency: 3,
          rank: 1,
        }),
        expect.objectContaining({
          keyword: "認証失敗",
          frequency: 2,
          rank: 2,
        }),
      ]),
      totalKeywordCount: 2,
      extractedAt: expect.any(Date),
      analysisperiodDays: 7,
    });

    // Verify that the keywords are ranked by frequency (descending)
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1].frequency
    );

    // Verify cache indicator is present in result
    expect(result).toHaveProperty("cacheSource", "fallback");
  });
});