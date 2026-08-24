import { describe, test, expect } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告集約分析機能 - 月次レポートデータ抽出", () => {
  test("SCEN-2364: 集約期間の終了日が無効な日付形式のときエラーになる", () => {
    const validStartDate = "2026-01-01";
    const invalidEndDates = [
      "2026-13-45",
      "2026/01/01",
      "2026年1月1日",
      "",
      "2026-1-1",
      "01-01-2026",
      "invalid",
    ];

    invalidEndDates.forEach((invalidEndDate) => {
      expect(() => {
        extractMonthlyReportData({
          aggregationStartDate: validStartDate,
          aggregationEndDate: invalidEndDate,
          teamIds: ["team-001"],
          reportRecords: [
            {
              reportId: "report-001",
              reportedDate: new Date("2026-01-15"),
              teamId: "team-001",
              reporterUserId: "user-001",
              yesterdayAccomplishments: "タスクA完了",
              todayPlans: "タスクB開始",
              issues: "DB接続エラー",
            },
          ],
          minimumReportThreshold: 1,
        });
      }).toThrow(/終了日/);
    });
  });
});