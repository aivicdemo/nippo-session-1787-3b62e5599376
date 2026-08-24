import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・頻度ランク付け機能", () => {
  // SCEN-1482
  test("TextAnalysisServiceAdapterが正常応答したとき、抽出キーワードが外部サービスの結果を反映している", () => {
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "データベース接続エラー", frequency: 3 },
          { keyword: "本番環境", frequency: 2 },
          { keyword: "緊急対応", frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const reportText =
      "本番環境でデータベース接続エラーが発生した。緊急対応が必要。本番環境の設定を確認中。データベース接続エラーの原因は特定できていない。";

    const result = extractAndRankIssueKeywords(input, mockAdapter);

    expect(result).toHaveProperty("keywords");
    expect(result.keywords).toEqual(
      expect.arrayContaining([
        {
          keywordId: expect.any(String),
          keyword: "データベース接続エラー",
          frequency: 3,
          rank: 1,
        },
        {
          keywordId: expect.any(String),
          keyword: "本番環境",
          frequency: 2,
          rank: 2,
        },
        {
          keywordId: expect.any(String),
          keyword: "緊急対応",
          frequency: 2,
          rank: 3,
        },
      ])
    );

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    expect(mockAdapter.extractKeywords).toHaveBeenCalledWith(
      input.teamId,
      input.startDate,
      input.endDate,
      input.minFrequencyThreshold
    );
  });
});