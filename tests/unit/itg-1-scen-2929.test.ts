import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・頻度ランク付け機能", () => {
  test("SCEN-2929: reportTimestamp が null のとき、エラーを返して TextAnalysisServiceAdapter を呼ばない", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };

    const invalidReport = {
      teamId: "team-123",
      startDate: new Date("2024-01-15T00:00:00Z"),
      endDate: new Date("2024-01-21T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-456",
      reportTimestamp: null,
    };

    const result = extractAndRankIssueKeywords(
      invalidReport,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      code: "INVALID_TIMESTAMP",
      message: "reportTimestamp is required",
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});