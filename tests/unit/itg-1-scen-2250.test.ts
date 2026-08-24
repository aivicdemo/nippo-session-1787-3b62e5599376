import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード抽出・ランキング機能", () => {
  // SCEN-2250: [error] 課題重複検出・正規化機能 - 重複判定対象のキーワード配列がnullのときエラーになる
  test("should throw error when keyword extraction returns null array from text analysis service", async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: async () => {
        return null;
      },
      assessImpactScore: async () => 50,
      classifyIssueSeverity: async () => "medium",
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/キーワード配列/);
  });
});