import { submitReport, type ValidationError } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 日報送信機能", () => {
  // SCEN-191: [error] 抱えている課題の文字数が上限を超えているときのバリデーションエラー
  test("課題が500文字を超える場合、ValidationErrorを投出する", () => {
    const reporterId = "ENG001";
    const teamId = "TEAM-A";
    const reportDate = new Date("2024-01-15T00:00:00Z");
    const yesterdayAccomplishment = "a".repeat(50);
    const todayPlan = "b".repeat(50);
    const issuesAndConcerns = "x".repeat(501);

    const submitReportInput = {
      reporterId,
      teamId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
    };

    expect(() => {
      submitReport(submitReportInput);
    }).toThrow(/課題は500文字以内/);
  });
});