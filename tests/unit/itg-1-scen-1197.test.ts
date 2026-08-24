import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード抽出・ランク付け機能", () => {
  // SCEN-1197
  test("信頼度スコアが基準値ちょうど（50.0）の課題は警告表示されない", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "性能低下",
            frequency: 3,
            confidenceScore: 50.0,
          },
        ],
        totalKeywords: 1,
        extractedAt: new Date("2024-01-15T09:00:00Z"),
      }),
      assessImpactScore: jest.fn().mockResolvedValue(50.0),
      classifyIssueSeverity: jest.fn().mockResolvedValue("medium"),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: "性能低下",
      frequency: 3,
      rank: 1,
      confidenceScore: 50.0,
      shouldHighlight: false,
      displayColor: "#808080",
    });
    expect(result.keywords[0].shouldHighlight).toBe(false);
    expect(result.keywords[0].displayColor).not.toBe("#FF0000");
  });
});