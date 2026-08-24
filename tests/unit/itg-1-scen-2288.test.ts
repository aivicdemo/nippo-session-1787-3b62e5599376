import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { calculateTeamPerformanceMetrics } from "../../src/logic/monthly-performance-analysis";
import type {
  TeamPerformanceMetricsInput,
  TeamPerformanceMetricsOutput,
} from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 生産性指標計算機能", () => {
  // SCEN-2288: [error] 生産性指標計算機能 - 課題発生頻度を計算する際にキーワード抽出が失敗したとき、キャッシュから前回結果を返し処理を続行する

  test("should use cached keyword extraction result when API fails with retry exhaustion and display dashboard fallback message", async () => {
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-01-31T23:59:59Z");
    const teamIds = ["team-001"];

    const dailyReportRecord = {
      reportId: "report-001",
      reportDate: new Date("2024-01-15T09:00:00Z"),
      teamId: "team-001",
      authorUserId: "user-001",
      yesterdayContent: "Handled network delays and DB connection errors",
      todayContent: "本日もネットワーク遅延とDB接続エラーの対応に追われた",
      issuesContent:
        "ネットワーク遅延とDB接続エラーが継続している状況",
      submissionTimestamp: new Date("2024-01-15T08:30:00Z"),
      isLateSubmission: false,
    };

    const cachedKeywordExtractionResult = {
      keywords: [
        { keyword: "ネットワーク遅延", frequency: 3 },
        { keyword: "DB接続エラー", frequency: 2 },
      ],
      extractionTimestamp: new Date("2024-01-08T09:00:00Z"),
      confidence: 0.85,
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(async () => {
        throw new Error("API timeout: extractKeywords request exceeded 30000ms");
      }),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue("medium"),
    };

    const mockKeywordCacheRepository = {
      getCachedKeywordExtractionForUser: jest
        .fn()
        .mockResolvedValue(cachedKeywordExtractionResult),
      saveCachedKeywordExtraction: jest.fn().mockResolvedValue(void 0),
    };

    const mockDashboardMessageService = {
      setFallbackMessage: jest.fn().mockResolvedValue(void 0),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords: [dailyReportRecord],
    };

    const result = await calculateTeamPerformanceMetrics(
      input,
      mockTextAnalysisServiceAdapter as any,
      mockKeywordCacheRepository as any,
      mockDashboardMessageService as any
    );

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(
      3
    );

    expect(mockKeywordCacheRepository.getCachedKeywordExtractionForUser).toHaveBeenCalledWith(
      "user-001"
    );

    expect(mockDashboardMessageService.setFallbackMessage).toHaveBeenCalledWith({
      message:
        "課題分析が一時的に利用できません。手動入力をご利用ください",
      severity: "warning",
    });

    expect(result).toBeDefined();
    expect(result.teamMetrics).toHaveLength(1);
    expect(result.teamMetrics[0].teamId).toBe("team-001");

    const issueFrequencyRanking = result.issueFrequencyRanking || [];
    expect(issueFrequencyRanking).toContainEqual(
      expect.objectContaining({
        issueKeyword: "ネットワーク遅延",
        frequency: 3,
      })
    );
    expect(issueFrequencyRanking).toContainEqual(
      expect.objectContaining({
        issueKeyword: "DB接続エラー",
        frequency: 2,
      })
    );

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});