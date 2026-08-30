import { describe, test, expect } from "@jest/globals";
import { analyzeProductivityTrends } from "../../src/logic/productivity-metrics-calculation";
import type {
  ProductivityTrendsAnalysisInput,
  ProductivityMetricsDataPoint,
  SuccessCriteria,
  ProductivityTrendsAnalysisResult,
} from "../../src/logic/productivity-metrics-calculation";

describe("analyzeProductivityTrends", () => {
  // SCEN-104: [normal] 計算済みの生産性指標から月次・四半期ごとの傾向を分析し、チーム全体のパフォーマンス変動を判定して、対策効果の成功判定基準との比較結果を報告書として提示する
  test("should analyze productivity trends and return success judgment result when valid input provided", () => {
    const dataPoint1: ProductivityMetricsDataPoint = {
      periodDate: new Date("2024-01-15"),
      issueResolutionSpeed: 5.2,
      reportSubmissionRate: 85.0,
      issueRecurrenceRate: 22.5,
      teamProductivityScore: 72.0,
    };

    const dataPoint2: ProductivityMetricsDataPoint = {
      periodDate: new Date("2024-02-15"),
      issueResolutionSpeed: 4.8,
      reportSubmissionRate: 90.0,
      issueRecurrenceRate: 18.0,
      teamProductivityScore: 78.5,
    };

    const dataPoint3: ProductivityMetricsDataPoint = {
      periodDate: new Date("2024-03-15"),
      issueResolutionSpeed: 4.1,
      reportSubmissionRate: 92.5,
      issueRecurrenceRate: 15.5,
      teamProductivityScore: 84.0,
    };

    const successCriteria: SuccessCriteria = {
      productivityImprovementRateTarget: 15.0,
      issueRecurrenceRateReductionTarget: 30.0,
      deadlineComplianceRateTarget: 90.0,
    };

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date("2024-01-01"),
      aggregationPeriodEnd: new Date("2024-03-31"),
      productivityMetricsDataPoints: [dataPoint1, dataPoint2, dataPoint3],
      successCriteria: successCriteria,
      teamId: "team-001",
      analysisContext:
        "対策実行計画の背景情報：Q1における生産性向上施策の効果測定",
    };

    const result: ProductivityTrendsAnalysisResult =
      analyzeProductivityTrends(input);

    expect(result).toBeDefined();
    expect(result.trendDirection).toMatch(/^(improving|declining|stable)$/);
    expect(Array.isArray(result.monthlyTrendData)).toBe(true);
    expect(result.monthlyTrendData.length).toBeGreaterThanOrEqual(1);

    result.monthlyTrendData.forEach((monthlyData) => {
      expect(monthlyData).toHaveProperty("periodDate");
      expect(monthlyData).toHaveProperty("issueResolutionSpeed");
      expect(monthlyData).toHaveProperty("reportSubmissionRate");
      expect(monthlyData).toHaveProperty("issueRecurrenceRate");
      expect(monthlyData).toHaveProperty("teamProductivityScore");
      expect(monthlyData).toHaveProperty("trendJudgment");
    });

    expect(result.successJudgmentResult).toBeDefined();
    expect(result.successJudgmentResult).toHaveProperty(
      "successJudgment"
    );
    expect(result.successJudgmentResult).toHaveProperty("achievementRates");
    expect(result.successJudgmentResult).toHaveProperty("judgmentReason");

    if (result.successJudgmentResult.achievementRates) {
      const rates = result.successJudgmentResult.achievementRates;
      expect(typeof rates.productivityImprovementRate).toBe("number");
      expect(typeof rates.issueRecurrenceRateReductionRate).toBe("number");
      expect(typeof rates.deadlineComplianceRate).toBe("number");
    }

    expect(typeof result.reportContent).toBe("string");
    expect(result.reportContent.length).toBeGreaterThan(0);
    expect(result.reportContent).toMatch(/生産性/);
    expect(result.reportContent).toMatch(/傾向/);
  });
});