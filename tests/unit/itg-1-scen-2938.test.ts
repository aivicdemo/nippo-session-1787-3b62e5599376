import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Ranking - Keyword Frequency Threshold Boundary", () => {
  // SCEN-2938
  test("should position keyword with frequency exactly at threshold to correct rank boundary", async () => {
    // Setup: keyword frequency exactly at threshold (5 == 5)
    const targetKeyword = "DB接続エラー";
    const thresholdFrequency = 5;
    const keywordFrequency = 5;

    // Mock TextAnalysisServiceAdapter stub
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: targetKeyword,
          frequency: keywordFrequency,
        },
        {
          keyword: "ネットワークタイムアウト",
          frequency: 8,
        },
        {
          keyword: "メモリ不足",
          frequency: 6,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(45),
      classifyIssueSeverity: jest.fn().mockResolvedValue("medium"),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: thresholdFrequency,
      requestUserId: "user-001",
    };

    // Execute
    const result: RankedIssueKeywordList =
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assertions
    // 1. Result structure is correct
    expect(result).toHaveProperty("keywords");
    expect(result).toHaveProperty("totalKeywordCount");
    expect(result).toHaveProperty("extractedAt");
    expect(result).toHaveProperty("analysisperiodDays");

    // 2. Analysis period is exactly 7 days (Jan 8 00:00 to Jan 14 23:59)
    expect(result.analysisperiodDays).toBe(7);

    // 3. Total keyword count before filtering (all 3 keywords)
    expect(result.totalKeywordCount).toBe(3);

    // 4. Keywords array includes target keyword since frequency (5) >= threshold (5)
    const targetKeywordEntry = result.keywords.find(
      (k) => k.keyword === targetKeyword
    );
    expect(targetKeywordEntry).toBeDefined();
    expect(targetKeywordEntry?.frequency).toBe(keywordFrequency);

    // 5. Keywords are ranked by frequency in descending order
    expect(result.keywords.length).toBe(3);
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1].frequency
    );
    expect(result.keywords[1].frequency).toBeGreaterThanOrEqual(
      result.keywords[2].frequency
    );

    // 6. Target keyword with frequency=5 is positioned at rank boundary
    // Expected ranking: 1. ネットワークタイムアウト (freq=8), 2. メモリ不足 (freq=6), 3. DB接続エラー (freq=5)
    const targetKeywordRank = result.keywords.findIndex(
      (k) => k.keyword === targetKeyword
    );
    expect(targetKeywordRank).toBe(2); // rank 3 (0-indexed position 2)

    // 7. Rank value is correctly assigned (1-based ranking)
    expect(targetKeywordEntry?.rank).toBe(3);

    // 8. Keyword ID is assigned
    expect(targetKeywordEntry?.keywordId).toBeDefined();
    expect(typeof targetKeywordEntry?.keywordId).toBe("string");

    // 9. extractedAt is a valid date
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.toISOString()).toBeDefined();

    // 10. All keywords with frequency >= threshold are included
    const keywordsAtOrAboveThreshold = result.keywords.filter(
      (k) => k.frequency >= thresholdFrequency
    );
    expect(keywordsAtOrAboveThreshold.length).toBe(3);
  });
});