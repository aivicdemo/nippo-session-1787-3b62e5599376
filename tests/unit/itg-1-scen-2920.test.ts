import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  let mockTextAnalysisServiceAdapter: {
    extractKeywords: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  // SCEN-2920
  test("should rank extracted issue keywords in descending order by frequency", async () => {
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

    const mockExtractedData = [
      { keyword: "キーワードA", frequency: 12 },
      { keyword: "キーワードB", frequency: 8 },
      { keyword: "キーワードC", frequency: 15 },
      { keyword: "キーワードD", frequency: 5 },
    ];

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValueOnce(
      mockExtractedData
    );

    const result: RankedIssueKeywordList =
      await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.keywords).toHaveLength(4);
    expect(result.keywords[0]).toEqual({
      keyword: "キーワードC",
      frequency: 15,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keyword: "キーワードA",
      frequency: 12,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keyword: "キーワードB",
      frequency: 8,
      rank: 3,
    });
    expect(result.keywords[3]).toEqual({
      keyword: "キーワードD",
      frequency: 5,
      rank: 4,
    });

    expect(result.totalKeywordCount).toBe(4);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});