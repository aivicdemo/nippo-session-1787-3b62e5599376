import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  // SCEN-1488: [error] 課題キーワード自動抽出・頻度ランク付け機能 - 対象期間の開始日がnullのとき、エラーを返す
  test("should throw error when startDate is null", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: {},
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: null as any,
      endDate: new Date("2024-01-31T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-123",
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/startDate|期間|開始日/);
  });
});