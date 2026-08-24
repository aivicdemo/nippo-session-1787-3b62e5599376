import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  test("SCEN-828: Keywords are correctly ranked by impact score in descending order", async () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { word: "障害", frequency: 1 },
          { word: "API", frequency: 1 },
          { word: "遅延", frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        scores: [
          { word: "障害", score: 85 },
          { word: "API", score: 60 },
          { word: "遅延", score: 75 },
        ],
      }),
    };

    // Test data: single report with issue text
    const reportText =
      "OpenAI APIの遅延により障害が発生しました。早急な対応が必要です。";

    // Execute the function
    const result = await extractAndRankIssueKeywords(
      reportText,
      mockTextAnalysisService
    );

    // Verify: keywords are ranked by impact score in descending order
    expect(result).toEqual({
      keywords: [
        { word: "障害", score: 85, frequency: 1 },
        { word: "遅延", score: 75, frequency: 1 },
        { word: "API", score: 60, frequency: 1 },
      ],
    });

    // Verify mock methods were called
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      reportText
    );
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalled();
  });
});