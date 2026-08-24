import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import { type ExtractIssueKeywordsInput } from "../../src/logic/issue-extraction-prioritization";

describe("課題自動抽出・優先度判定機能 - キーワード抽出エラーハンドリング", () => {
  // SCEN-765
  test("抽出されたキーワードがnullのとき、エラーを返す", async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    const mockReports = [
      {
        reportId: "report-001",
        teamId: "team-001",
        reportDate: new Date("2024-01-10T09:00:00Z"),
        issueContent: "システム障害が発生した。対応が必要",
      },
    ];

    try {
      await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter,
        mockReports
      );
      fail("エラーがスローされるべき");
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/課題キーワード抽出|INVALID_KEYWORDS/);
      } else if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
      ) {
        expect((error as { code: string; message: string }).code).toBe(
          "INVALID_KEYWORDS"
        );
        expect((error as { code: string; message: string }).message).toMatch(
          /課題キーワード抽出に失敗|手動入力/
        );
      } else {
        throw error;
      }
    }

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(
      mockTextAnalysisServiceAdapter.assessImpactScore
    ).not.toHaveBeenCalled();
    expect(
      mockTextAnalysisServiceAdapter.classifyIssueSeverity
    ).not.toHaveBeenCalled();
  });
});