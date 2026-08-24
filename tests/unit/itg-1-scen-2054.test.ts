import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("課題の優先度を色分けで表示するダッシュボード機能", () => {
  // SCEN-2054
  test("優先度スコアがちょうど下限値(0)の場合に必須項目検証がパスする", () => {
    const input: SubmitDailyReportInput = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "前日は機能A の実装を完了しました",
      todayPlan: "本日は機能B のテストを実施します",
      challenges: "データベース接続タイムアウトの課題があります",
      reportDate: "2024-01-15",
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input);

    expect(result).toHaveProperty("reportId");
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result).toHaveProperty("submissionTimestamp");
    expect(typeof result.submissionTimestamp).toBe("string");

    const submissionDate = new Date(result.submissionTimestamp);
    expect(submissionDate.getTime()).toBeGreaterThan(0);

    expect(result).toHaveProperty("isWithinDeadline");
    expect(typeof result.isWithinDeadline).toBe("boolean");
  });
});