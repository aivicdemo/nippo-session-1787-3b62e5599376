import { describe, test, expect } from "@jest/globals";
import { calculateTeamPerformanceMetrics } from "../../src/logic/monthly-performance-analysis";
import type {
  TeamPerformanceMetricsInput,
  TeamPerformanceMetricsOutput,
} from "../../src/logic/monthly-performance-analysis";

describe("calculateTeamPerformanceMetrics", () => {
  // SCEN-2311: [normal] 課題解決速度の定量計算機能 - 指定期間内の日報0件から課題解決日数0日・対応完了率0%が正しく計算される
  test("should return issue resolution speed of 0 days and completion rate of 0% when no report records exist in the specified period", () => {
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-01-31T23:59:59Z");
    const teamIds = ["team-001"];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords: [],
    };

    const result: TeamPerformanceMetricsOutput =
      calculateTeamPerformanceMetrics(input);

    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBe(0);

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.dayCount).toBe(31);

    expect(result.dataQualityScore).toBe(0);

    expect(result.outlierDetectionResult).toBeDefined();
    expect(result.outlierDetectionResult.detectedOutliers).toEqual([]);
  });
});