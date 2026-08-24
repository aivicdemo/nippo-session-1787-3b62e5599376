import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractWeeklyReportData } from "../../src/logic/weekly-issue-analysis";
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from "../../src/logic/weekly-issue-analysis";

describe("Weekly Issue Analysis - extractWeeklyReportData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1457: [error] 前週日報データ集約機能 - TextAnalysisServiceAdapterの課題キーワード抽出機能が失敗した場合にキャッシュから前回結果を取得する
  test("should retrieve cached keyword extraction results when TextAnalysisServiceAdapter fails after 3 retries", async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockRejectedValueOnce(new Error("API timeout"))
        .mockRejectedValueOnce(new Error("API timeout"))
        .mockRejectedValueOnce(new Error("API timeout")),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const mockCacheRepository = {
      getLastExtractedKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "ネットワーク遅延",
            occurrenceCount: 3,
            extractedAt: new Date("2024-01-14T10:00:00Z"),
          },
        ],
        isCached: true,
        cacheMessage: "課題分析が一時的に利用できません。手動入力をご利用ください",
      }),
    };

    const request: WeeklyExtractionRequest = {
      weekStartDate: new Date("2024-01-15T00:00:00Z"),
      weekEndDate: new Date("2024-01-21T23:59:59Z"),
      teamIds: ["team-001"],
      requestedByUserId: "user-001",
    };

    const dailyReports = [
      {
        reportDate: new Date("2024-01-15T09:00:00Z"),
        reportCount: 1,
        submittedByUserIds: ["user-001"],
        challengeItems: ["本日もネットワーク遅延が継続中。対応検討中。"],
      },
    ];

    const result: WeeklyReportDataset = await extractWeeklyReportData(
      request,
      mockTextAnalysisAdapter,
      mockCacheRepository
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    expect(mockCacheRepository.getLastExtractedKeywords).toHaveBeenCalledTimes(1);
    expect(mockCacheRepository.getLastExtractedKeywords).toHaveBeenCalledWith(
      "user-001",
      "team-001"
    );

    expect(result.extractedChallenges).toEqual([
      {
        challengeKeyword: "ネットワーク遅延",
        occurrenceCount: 3,
        rank: 1,
        isCachedResult: true,
        cacheExtractionDate: new Date("2024-01-14T10:00:00Z"),
      },
    ]);

    expect(result.weekRange).toEqual({
      startDate: new Date("2024-01-15T00:00:00Z"),
      endDate: new Date("2024-01-21T23:59:59Z"),
    });

    expect(result.totalReportsExtracted).toBe(1);
    expect(result.reportsByDate).toHaveLength(1);
    expect(result.reportsByDate[0]).toEqual({
      reportDate: new Date("2024-01-15T09:00:00Z"),
      reportCount: 1,
      submittedByUserIds: ["user-001"],
      challengeItems: ["本日もネットワーク遅延が継続中。対応検討中。"],
    });

    expect(result.dataQualityScore).toBe(50);
  });
});