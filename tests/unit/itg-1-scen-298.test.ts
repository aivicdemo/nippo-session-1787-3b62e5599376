import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { submitReport } from "../../src/logic/report-submission-management";
import type { SubmitReportInput } from "../../src/logic/report-submission-management";

describe("Report Submission Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-298: [error] エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する - 今日やることが空白のときという明示された境界条件で今日やることを入力してください
  test("should throw ValidationError with today plan empty message when todayPlan is empty string", () => {
    const input: SubmitReportInput = {
      reporterId: "ENG001",
      teamId: "TEAM-A",
      reportDate: new Date("2024-01-15"),
      yesterdayAccomplishment: "昨日完了したタスク",
      todayPlan: "",
      issuesAndConcerns: "現在の課題"
    };

    expect(() => submitReport(input)).toThrow(/今日やることを入力してください/);
  });
});