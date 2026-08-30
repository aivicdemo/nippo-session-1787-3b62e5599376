import { submitReport, type SubmitReportInput } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム", () => {
  // SCEN-194: [error] 送信時刻がシステム時刻より未来の場合、エラーを発生させる
  test("submitReport: 送信時刻が未来の場合、エラーを発生させる", () => {
    const baseTimestamp = new Date("2026-08-19T08:00:00Z");
    const futureTimestamp = new Date("2026-08-19T08:05:00Z");

    const input: SubmitReportInput = {
      reporterId: "engineer-001",
      teamId: "team-A",
      reportDate: new Date("2026-08-19"),
      yesterdayAccomplishment: "昨日実施した業務内容をここに記入します。",
      todayPlan: "本日予定している業務内容をここに記入します。",
      issuesAndConcerns: "現在抱えている課題や懸念事項をここに記入します。",
      submissionTimestamp: futureTimestamp,
    };

    expect(() => submitReport(input)).toThrow(/送信時刻/);
  });
});