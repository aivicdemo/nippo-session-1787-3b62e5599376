import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度を判定し優先度スコアで順序付けして表示する機能", () => {
  // SCEN-760
  test("優先度スコアがnullのとき、エラーを返す", async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "データベース接続エラー",
            frequency: 2,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    const reportTexts = [
      "本番環境でデータベース接続エラー発生",
      "データベース接続エラーで業務停止",
    ];

    const error = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService,
      reportTexts
    ).catch((err) => err);

    expect(error).toBeDefined();
    expect(error.message).toMatch(/課題分析が一時的に利用できません/);
    expect(error.code).toBe("PRIORITY_SCORE_NULL");
  });
});