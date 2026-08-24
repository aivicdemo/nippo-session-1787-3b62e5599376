import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信処理", () => {
  // SCEN-2498: [edge] 操作習熟度スコア自動計算 - 操作習熟度スコアが71点のとき合格判定される
  test("操作習熟度スコアが71点のとき合格判定がtrueで返される", () => {
    const testInput: SubmitDailyReportInput = {
      userId: "user-001-initial-learner",
      teamId: "team-001-onboarding",
      yesterdayAccomplishment: "フォーム入力を完了した",
      todayPlan: "日報システムの本運用に移行する予定",
      challenges: "UIの操作方法を習得する",
      reportDate: "2024-01-15"
    };

    const result: SubmitDailyReportOutput = submitDailyReport(testInput);

    expect(result).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        submissionTimestamp: expect.any(String),
        isWithinDeadline: expect.any(Boolean)
      })
    );

    expect(result.reportId).toBeTruthy();
    expect(result.reportId.length).toBeGreaterThan(0);

    const submissionTime = new Date(result.submissionTimestamp);
    expect(submissionTime.getTime()).toBeGreaterThan(0);

    expect(typeof result.isWithinDeadline).toBe("boolean");
  });
});