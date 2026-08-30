import { submitReport, type SubmitReportInput } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム", () => {
  test("SCEN-304: submitReport - 送信時刻がシステム時刻より未来の場合、エラーを発生させる", () => {
    const systemTime = new Date("2026-08-20T09:00:00.000Z");
    const futureSubmissionTime = new Date("2026-08-20T09:00:01.000Z");

    const input: SubmitReportInput = {
      reporterId: "ENG001",
      teamId: "TEAM-A",
      reportDate: new Date("2026-08-20"),
      yesterdayAccomplishment: "昨日の成果",
      todayPlan: "今日の予定",
      issuesAndConcerns: "課題内容",
      submissionTimestamp: futureSubmissionTime,
    };

    expect(() => submitReport(input, systemTime)).toThrow(/システム時刻/);
  });
});