import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Prioritization - Negative Frequency Handling", () => {
  // SCEN-542: [error] 課題キーワード自動抽出・優先度判定機能 - 発生頻度が負の値の場合、エラーを返す
  test("should handle negative frequency from extractKeywords and apply retry logic with fallback", async () => {
    const teamId = "team-001";
    const startDate = new Date("2024-01-08T00:00:00Z");
    const endDate = new Date("2024-01-14T23:59:59Z");
    const requestUserId = "user-manager-001";

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };

    const mockLoggerAdapter = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const mockCacheAdapter = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const reportTexts = [
      "システムがダウンしている。対応が必要。対応が必要。",
    ];

    const invalidKeywordsResponse = {
      keywords: [
        {
          keyword: "システムダウン",
          frequency: -1,
        },
        {
          keyword: "対応必要",
          frequency: 2,
        },
      ],
      extractedAt: new Date("2024-01-14T10:30:00Z"),
    };

    const cachedPreviousResult = {
      keywords: [
        {
          keywordId: "kw-sys-001",
          keyword: "システムダウン",
          frequency: 1,
          rank: 1,
        },
      ],
      totalKeywordCount: 1,
      extractedAt: new Date("2024-01-13T10:00:00Z"),
      analysisperiodDays: 7,
    };

    mockTextAnalysisAdapter.extractKeywords
      .mockRejectedValueOnce(new Error("Invalid frequency"))
      .mockRejectedValueOnce(new Error("Invalid frequency"))
      .mockRejectedValueOnce(new Error("Invalid frequency"))
      .mockResolvedValueOnce(invalidKeywordsResponse);

    mockCacheAdapter.get.mockResolvedValue(cachedPreviousResult);

    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId,
      },
      mockTextAnalysisAdapter,
      mockLoggerAdapter,
      mockCacheAdapter
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(4);

    expect(mockLoggerAdapter.error).toHaveBeenCalledWith(
      expect.stringContaining("発生頻度が負の値として検出されたため")
    );

    expect(mockCacheAdapter.get).toHaveBeenCalled();

    expect(result).toEqual({
      keywords: cachedPreviousResult.keywords,
      totalKeywordCount: cachedPreviousResult.totalKeywordCount,
      extractedAt: cachedPreviousResult.extractedAt,
      analysisperiodDays: cachedPreviousResult.analysisperiodDays,
      fallbackReason:
        "課題分析が一時的に利用できません。手動入力をご利用ください",
      usedCache: true,
    });
  });
});