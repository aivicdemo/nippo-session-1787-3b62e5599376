import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  // SCEN-1296: [normal] 課題キーワード自動抽出機能 - TextAnalysisServiceAdapterが正常応答した場合、抽出キーワードがダッシュボードに反映される
  test("should extract and rank issue keywords when TextAnalysisServiceAdapter returns successfully", async () => {
    // Arrange
    const teamId = "team-001";
    const startDate = new Date("2024-01-08T00:00:00Z");
    const endDate = new Date("2024-01-14T23:59:59Z");
    const minFrequencyThreshold = 1;
    const requestUserId = "user-manager-001";

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Mock TextAnalysisServiceAdapter - successful response
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["納期遅延", "リソース不足", "バグ対応"],
        frequencies: {
          "納期遅延": 3,
          "リソース不足": 2,
          "バグ対応": 1,
        },
      }),
    };

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);

    // Verify keyword 1: 納期遅延 (rank 1, frequency 3)
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: "納期遅延",
      frequency: 3,
      rank: 1,
    });

    // Verify keyword 2: リソース不足 (rank 2, frequency 2)
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: "リソース不足",
      frequency: 2,
      rank: 2,
    });

    // Verify keyword 3: バグ対応 (rank 3, frequency 1)
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: "バグ対応",
      frequency: 1,
      rank: 3,
    });

    // Verify total keyword count and analysis metadata
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    // Verify TextAnalysisServiceAdapter was called with correct input
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
      })
    );
  });
});