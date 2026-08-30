import { submitReport } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム", () => {
  // SCEN-196
  test("エンジニアIDが空の場合、ユーザー情報取得エラーが発生する", () => {
    const invalidReporterId = "";
    const validTeamId = "team-001";
    const validReportDate = new Date("2024-01-15T09:00:00Z");
    const validYesterdayAccomplishment = "昨日の実績";
    const validTodayPlan = "今日の予定";
    const validIssuesAndConcerns = "課題内容";

    expect(() =>
      submitReport({
        reporterId: invalidReporterId,
        teamId: validTeamId,
        reportDate: validReportDate,
        yesterdayAccomplishment: validYesterdayAccomplishment,
        todayPlan: validTodayPlan,
        issuesAndConcerns: validIssuesAndConcerns,
      })
    ).toThrow(/ユーザー情報/);
  });
});