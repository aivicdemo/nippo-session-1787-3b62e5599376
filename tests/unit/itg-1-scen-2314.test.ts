import { calculateTeamPerformanceMetrics } from "../../src/logic/monthly-performance-analysis";
import type {
  TeamPerformanceMetricsInput,
  TeamPerformanceMetricsOutput,
  DailyReportRecord,
} from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - チーム別パフォーマンス指標計算", () => {
  // SCEN-2314
  test("課題が報告日と同日に解決した場合、課題解決日数が1日として計算される", () => {
    // 準備: 2025年1月15日を報告日とする課題データを構築
    const reportedDate = new Date("2025-01-15T09:00:00Z");
    const resolvedDate = new Date("2025-01-15T17:00:00Z"); // 同日解決

    const dailyReportRecord: DailyReportRecord = {
      reportId: "report-001",
      teamId: "team-engineering",
      reportedDate: reportedDate,
      yesterdayAccomplishment: "機能A の実装完了",
      todayPlan: "機能B の実装開始",
      issueDescription: "データベース接続タイムアウト",
      issueReportedDate: reportedDate,
      issueResolvedDate: resolvedDate,
      issueStatus: "resolved",
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: new Date("2025-01-01T00:00:00Z"),
      aggregationEndDate: new Date("2025-01-31T23:59:59Z"),
      teamIds: ["team-engineering"],
      reportDataset: [dailyReportRecord],
    };

    // 実行: チーム別パフォーマンス指標計算関数を呼び出し
    const result: TeamPerformanceMetricsOutput =
      calculateTeamPerformanceMetrics(input);

    // 検証: 計算結果を確認
    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find(
      (metric) => metric.teamId === "team-engineering"
    );
    expect(teamMetric).toBeDefined();

    // 課題解決速度が1日として計算されていることを確認
    expect(teamMetric?.issueResolutionSpeed).toBe(1);
  });
});