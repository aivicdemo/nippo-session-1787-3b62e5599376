import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { analyzeBottleneckTrendWithTimeSeries } from "../../src/logic/monthly-performance-analysis";
import type {
  BottleneckAnalysisInput,
  IssueTimeSeriesRecord,
} from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度スコア表示機能", () => {
  // SCEN-2281: [normal] 改善施策推奨機能 - 課題解決速度が遅い部門が0件の場合、改善施策リストは空で返される
  test("should return empty improvement strategies list when no bottleneck issues exceed threshold", () => {
    // 準備: TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn().mockResolvedValue(0),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // テスト入力データ: 課題解決速度が遅い部門が0件のシナリオ
    const analysisInput: BottleneckAnalysisInput = {
      analysisStartDate: new Date("2024-01-01T00:00:00Z"),
      analysisEndDate: new Date("2024-01-31T23:59:59Z"),
      issueTimeSeriesData: [
        {
          issueId: "issue-001",
          recordDate: new Date("2024-01-15"),
          occurrenceCount: 1,
          impactScore: 20,
          resolutionDaysElapsed: 2,
          resolutionStatus: "resolved" as const,
        },
        {
          issueId: "issue-002",
          recordDate: new Date("2024-01-20"),
          occurrenceCount: 1,
          impactScore: 15,
          resolutionDaysElapsed: 1,
          resolutionStatus: "resolved" as const,
        },
      ],
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    // 対象関数を呼び出し
    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisInput,
      mockTextAnalysisAdapter as any
    );

    // 検証: TextAnalysisServiceAdapterのモックが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // 検証: 改善施策リストが空配列で返されることを確認
    expect(result.improvementStrategies).toEqual([]);

    // 検証: 結果オブジェクトの構造が正しいことを確認
    expect(result).toHaveProperty("issueId");
    expect(result).toHaveProperty("bottleneckSeverityRank");
    expect(result).toHaveProperty("bottleneckSeverityScore");
    expect(result).toHaveProperty("improvementTrend");
    expect(result).toHaveProperty("averageResolutionDays");
    expect(result).toHaveProperty("peakOccurrenceDate");
    expect(result).toHaveProperty("timeSeriesTrendData");
    expect(result).toHaveProperty("improvementStrategies");

    // 検証: 課題解決速度が遅い部門が検出されないため、ボトルネック深刻度ランクが低いレベルであることを確認
    expect(
      ["low", "medium"].includes(result.bottleneckSeverityRank)
    ).toBe(true);

    // 検証: 時系列トレンドデータが配列で返されることを確認
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);
  });
});