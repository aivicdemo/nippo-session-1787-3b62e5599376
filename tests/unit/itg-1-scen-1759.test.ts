import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyReportDataset, TeamReportSummary } from "../../src/logic/monthly-performance-analysis";

describe("extractMonthlyReportData", () => {
  // SCEN-1759: [normal] 月次レポート生成データ抽出機能 - 抽出対象期間内に報告データが1件の場合、その1件がデータセットに含まれて確定される
  test("should extract single report within target period and confirm dataset with correct aggregation", () => {
    // Setup: 抽出対象期間を2024年1月1日〜2024年1月31日に設定
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = "user-admin-001";
    
    // 当該期間内に報告データ1件を作成（2024年1月15日にユーザーAが入力・送信）
    const reportId = "report-001";
    const userId = "user-A";
    const reportDate = "2024-01-15T09:30:00Z";
    const yesterdayAccomplishment = "Database optimization completed";
    const todayPlan = "API testing and documentation";
    const currentIssue = "Performance bottleneck in query";
    
    // 月次レポート生成機能を実行し、当該期間のデータ抽出処理を開始
    const dataset: MonthlyReportDataset = extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
      reportRecords: [
        {
          reportId,
          userId,
          reportedAt: reportDate,
          yesterdayAccomplishment,
          todayPlan,
          currentIssue,
          teamId: "team-dev-001",
          submittedAt: reportDate
        }
      ]
    });

    // 抽出処理の完了後、生成されたデータセットの内容を検証
    // レポート確定処理を実行（データセット内容の検証）
    
    // 期待結果: 月次レポート生成データセットに、作成した1件の報告データが含まれ、確定状態
    expect(dataset.totalReportCount).toBe(1);
    expect(dataset.extractionPeriodStart).toBe("2024-01-01T00:00:00Z");
    expect(dataset.extractionPeriodEnd).toBe("2024-01-31T23:59:59Z");
    expect(dataset.reportsByTeam).toBeDefined();
    expect(dataset.reportsByTeam.length).toBeGreaterThanOrEqual(1);
    
    // チーム別集計結果を検証
    const teamReportSummary: TeamReportSummary | undefined = dataset.reportsByTeam.find(
      (summary: TeamReportSummary) => summary.teamId === "team-dev-001"
    );
    expect(teamReportSummary).toBeDefined();
    expect(teamReportSummary!.reportCount).toBe(1);
    expect(teamReportSummary!.reportIds).toContain(reportId);
    
    // データセット品質スコアが0〜100の範囲内で設定されていることを検証
    expect(dataset.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(dataset.dataQualityScore).toBeLessThanOrEqual(100);
    
    // 抽出実行日時が記録されていることを検証（ISO 8601形式）
    expect(dataset.extractedAt).toBeDefined();
    expect(typeof dataset.extractedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(dataset.extractedAt)).toBe(true);
    
    // 提出率が0〜100の範囲内で計算されていることを検証
    expect(teamReportSummary!.submissionRate).toBeGreaterThanOrEqual(0);
    expect(teamReportSummary!.submissionRate).toBeLessThanOrEqual(100);
  });
});