import { describe, test, expect } from "@jest/globals";
import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("Daily Report Submission - Empty Required Field Validation", () => {
  test("SCEN-077: submitDailyReport returns validation error when yesterdayAccomplishment is empty", () => {
    const input = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "",
      todayPlan: "タスクA実施",
      challenges: "課題B対応中",
      reportDate: "2024-01-15",
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});