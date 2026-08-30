import { calculateProductivityMetrics } from "../../src/logic/productivity-metrics-calculation";
import { type ProductivityMetricsInput, type ProductivityMetricsOutput } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム - 生産性指標計算", () => {
  // SCEN-543: 指定期間内に報告された課題が1件も存在しないときの境界条件テスト
  test("should throw InsufficientDataError when no issues are reported in the specified aggregation period", async () => {
    const input: ProductivityMetricsInput = {
      aggregationStartDate: new Date("2024-01-01T00:00:00Z"),
      aggregationEndDate: new Date("2024-01-31T23:59:59Z"),
      targetTeamIds: ["team-001"],
      excludeOutliers: false,
    };

    expect(() => {
      calculateProductivityMetrics(input);
    }).toThrow(/分析に必要な最小限のデータが不足しています/);
  });
});