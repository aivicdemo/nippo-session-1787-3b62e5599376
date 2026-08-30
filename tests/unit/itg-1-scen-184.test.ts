import { submitReport, type ValidationError } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 日報送信", () => {
  // SCEN-184
  test("エンジニアが日報を送信する際、抱えている課題が空またはスペースのみのときは送信を拒否し、エラーメッセージを表示する", () => {
    const inputData = {
      reporterId: "engineer-001",
      teamId: "team-A",
      reportDate: new Date("2024-01-15"),
      yesterdayAccomplishment: "昨日完了したタスク",
      todayPlan: "今日実施する予定",
      issuesAndConcerns: "",
    };

    expect(() => submitReport(inputData)).toThrow(/抱えている課題/);
  });
});