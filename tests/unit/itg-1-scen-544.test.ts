import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("Issue keyword extraction and ranking - frequency threshold filtering", () => {
  let mockTextAnalysisServiceAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-544
  test("keywords with frequency below threshold are classified as low rank", async () => {
    const minFrequencyThreshold = 2;

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue([
      {
        keywordId: "kw-001",
        keyword: "A",
        frequency: 1,
        originalKeywords: ["A"],
      },
      {
        keywordId: "kw-002",
        keyword: "B",
        frequency: 2,
        originalKeywords: ["B"],
      },
      {
        keywordId: "kw-003",
        keyword: "C",
        frequency: 3,
        originalKeywords: ["C"],
      },
    ]);

    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation(
      (keyword: string) => {
        const scoreMap: Record<string, number> = {
          A: 25,
          B: 55,
          C: 80,
        };
        return scoreMap[keyword] || 50;
      }
    );

    mockTextAnalysisServiceAdapter.classifyIssueSeverity.mockImplementation(
      (keyword: string) => {
        const severityMap: Record<string, string> = {
          A: "low",
          B: "medium",
          C: "high",
        };
        return severityMap[keyword] || "medium";
      }
    );

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold,
      requestUserId: "user-001",
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(3);

    const keywordA = result.keywords.find((kw) => kw.keyword === "A");
    expect(keywordA).toBeDefined();
    expect(keywordA!.frequency).toBe(1);
    expect(keywordA!.rank).toBe(3);

    const keywordB = result.keywords.find((kw) => kw.keyword === "B");
    expect(keywordB).toBeDefined();
    expect(keywordB!.frequency).toBe(2);
    expect(keywordB!.rank).toBe(2);

    const keywordC = result.keywords.find((kw) => kw.keyword === "C");
    expect(keywordC).toBeDefined();
    expect(keywordC!.frequency).toBe(3);
    expect(keywordC!.rank).toBe(1);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      "A"
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      "B"
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      "C"
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(
      3
    );

    expect(
      mockTextAnalysisServiceAdapter.classifyIssueSeverity
    ).toHaveBeenCalledWith("A");
    expect(
      mockTextAnalysisServiceAdapter.classifyIssueSeverity
    ).toHaveBeenCalledWith("B");
    expect(
      mockTextAnalysisServiceAdapter.classifyIssueSeverity
    ).toHaveBeenCalledWith("C");
    expect(
      mockTextAnalysisServiceAdapter.classifyIssueSeverity
    ).toHaveBeenCalledTimes(3);
  });
});