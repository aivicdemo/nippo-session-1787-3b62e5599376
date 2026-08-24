import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告集約分析機能 - 月次報告データ抽出", () => {
  // SCEN-2357
  test("集約期間の開始日が指定されていないとき処理がエラーになる", () => {
    const aggregationStartDate = null;
    const aggregationEndDate = new Date("2026-08-25T23:59:59Z");
    const teamId = "team-001";
    const reportRecords = [
      {
        recordDate: new Date("2026-08-15T09:00:00Z"),
        teamId: "team-001",
        memberId: "member-001",
        yesterdayAccomplishment: "タスク完了",
        todayPlan: "次タスク開始",
        issues: "特になし",
      },
    ];

    expect(() =>
      extractMonthlyReportData(
        aggregationStartDate as any,
        aggregationEndDate,
        teamId,
        reportRecords
      )
    ).toThrow(/開始日/);
  });
});