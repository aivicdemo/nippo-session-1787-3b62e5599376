import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能", () => {
  // SCEN-1056
  test("出現頻度が負の値のとき、ランク付けがバリデーションエラーを発生させる", () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "システムダウン", frequency: -5 },
          { keyword: "業務停止", frequency: 3 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: "システムダウン",
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: "システムダウン",
        severity: "high",
      }),
    };

    const reportText = "システムダウンにより業務が停止した。システムダウンの影響は大きい。";
    const teamId = "team-001";
    const requestUserId = "user-001";

    expect(async () => {
      await extractAndRankIssueKeywords(
        {
          teamId,
          startDate: new Date("2024-01-08T00:00:00Z"),
          endDate: new Date("2024-01-14T23:59:59Z"),
          minFrequencyThreshold: 1,
          requestUserId,
        },
        mockTextAnalysisAdapter,
        reportText
      );
    }).rejects.toThrow(/出現頻度/);
  });
});