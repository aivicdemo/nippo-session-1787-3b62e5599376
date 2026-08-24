import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出機能", () => {
  test("SCEN-2173: 日報テキストが空文字列のとき、エラーが発生する", () => {
    const emptyReportText = "";
    const teamId = "team-001";
    const startDate = new Date("2024-01-08T00:00:00Z");
    const endDate = new Date("2024-01-14T23:59:59Z");
    const minFrequencyThreshold = 1;
    const requestUserId = "user-001";

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error(
          JSON.stringify({
            errorCode: "INVALID_INPUT",
            errorMessage: "日報テキストが空です",
          })
        )
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold,
          requestUserId,
        },
        emptyReportText,
        mockTextAnalysisAdapter
      )
    ).toThrow(/日報テキストが空/);
  });
});