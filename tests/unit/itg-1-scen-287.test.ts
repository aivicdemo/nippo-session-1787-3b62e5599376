import { submitReport, type SubmitReportInput, type SubmitReportOutput } from "../../src/logic/report-submission-management";

describe("Report Submission Management", () => {
  // SCEN-287
  test("should throw error when reporterId is empty string", async () => {
    const input: SubmitReportInput = {
      reporterId: "",
      teamId: "team-001",
      reportDate: new Date("2024-01-15"),
      yesterdayAccomplishment: "Completed API implementation",
      todayPlan: "Code review and testing",
      issuesAndConcerns: "Dependency version conflict",
    };

    await expect(() => submitReport(input)).rejects.toThrow(/エンジニア ID/);
  });
});