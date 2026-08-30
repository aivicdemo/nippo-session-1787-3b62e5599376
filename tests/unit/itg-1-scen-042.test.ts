import { validateReportInput } from "../../src/logic/report-submission-management";
import { type ReportInputData } from "../../src/logic/report-submission-management";

describe("Report Submission Management - validateReportInput", () => {
  // SCEN-042: [error] 必須項目（本日の実績、本日の課題、明日の予定）のいずれかが空文字列の場合、RequiredFieldMissingErrorが発生し、適切なエラーメッセージが返される
  test("should throw RequiredFieldMissing error when todayPlan is empty string", () => {
    const reportInputData: ReportInputData = {
      reporterId: "USER001",
      teamId: "TEAM001",
      yesterdayAccomplishment: "昨日の実績",
      todayPlan: "",
      issueDescription: "本日の課題",
    };

    expect(() => validateReportInput(reportInputData)).toThrow(
      /必須項目が入力されていません/
    );
  });
});