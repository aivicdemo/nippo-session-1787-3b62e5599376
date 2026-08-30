import { analyzeIssuePatternsByTimeRange } from "../../src/logic/issue-pattern-analysis";

describe("朝会報告管理システム - 課題パターン分析", () => {
  test("SCEN-098: データ整合性エラーが発生した場合、AnalysisExecutionErrorをスロー", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-31T23:59:59Z");
    const periodGranularity = "daily" as const;
    const teamId = null;

    const malformedTimeSeriesData = [
      {
        recordDate: new Date("2024-01-15T00:00:00Z"),
        keywordId: "keyword_001",
        dailyFrequency: 5,
        averageImpactScore: 75,
      },
      {
        recordDate: new Date("2024-01-10T00:00:00Z"),
        keywordId: "keyword_001",
        dailyFrequency: 3,
        averageImpactScore: 60,
      },
      {
        recordDate: new Date("2024-01-15T00:00:00Z"),
        keywordId: "keyword_002",
        dailyFrequency: 2,
        averageImpactScore: 50,
      },
    ];

    const keywordSummary = [
      {
        keywordId: "keyword_001",
        keywordName: "ビルド失敗",
        totalFrequency: 8,
        averageImpactScore: 67.5,
        trendDirection: "increasing" as const,
      },
      {
        keywordId: "keyword_002",
        keywordName: "テスト環境不安定",
        totalFrequency: 2,
        averageImpactScore: 50,
        trendDirection: "stable" as const,
      },
    ];

    const extractionMetadata = {
      extractedAt: new Date("2024-02-01T09:00:00Z"),
      analysisStartDate: startDate,
      analysisEndDate: endDate,
      affectedTeamCount: 0,
      totalExtractedIssueCount: 10,
    };

    const mockExtractedData = {
      timeSeriesRecords: malformedTimeSeriesData,
      keywordSummary: keywordSummary,
      extractionMetadata: extractionMetadata,
    };

    expect(() => {
      analyzeIssuePatternsByTimeRange(
        startDate,
        endDate,
        periodGranularity,
        teamId,
        mockExtractedData
      );
    }).toThrow(/課題パターン分析の実行中にエラーが発生しました/);
  });
});