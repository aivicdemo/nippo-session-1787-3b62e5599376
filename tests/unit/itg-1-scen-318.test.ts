import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信", () => {
  // SCEN-318
  test("朝会報告入力フォーム検証 - 「今日やること」項目がスペースのみのとき、エラー表示される", () => {
    const input: SubmitDailyReportInput = {
      userId: "engineer-001",
      teamId: "team-alpha",
      yesterdayAccomplishment: "会議に参加した",
      todayPlan: "   ",
      challenges: "データベース接続エラー",
      reportDate: "2024-01-15",
    };

    expect(() => submitDailyReport(input)).toThrow(/今日やること/);
  });
});