import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能", () => {
  test("SCEN-265: [edge] 報告遅延判定機能 - 送信時刻が期限の1秒前の場合、遅延なしと判定される", () => {
    const reportId = "report-test-001";
    const userId = "engineer-001";
    const submissionTimestamp = new Date("2024-01-15T08:59:59Z");
    const reportContent = {
      yesterdayAccomplishment: "データベース最適化を完了しました",
      todayPlan: "API実装を開始します",
      challenges: "接続タイムアウトの問題が発生しています"
    };

    const reportDeadline = new Date("2024-01-15T09:00:00Z");

    const result = submitDailyReport(
      {
        reportId,
        userId,
        submissionTimestamp,
        reportContent
      },
      reportDeadline
    );

    expect(result.isWithinDeadline).toBe(true);
    expect(result.deadlineComparisonResult.status).toBe("on_time");
    expect(result.deadlineComparisonResult.minutesBeforeDeadline).toBe(0.01666666666666667);
  });
});