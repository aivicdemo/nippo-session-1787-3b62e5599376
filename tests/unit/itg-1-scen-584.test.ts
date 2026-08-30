import { describe, test, expect } from "@jest/globals";
import { evaluateInitialReportSubmission } from "../../src/logic/adoption-training-management";
import type { InitialReportSubmissionInput } from "../../src/logic/adoption-training-management";

describe("朝会報告管理システム - 初回テスト報告検証", () => {
  // SCEN-584: 初回テスト報告検証 - 昨日の実績が空のときは例外をスロー
  test("should throw RequiredFieldMissingError when yesterdayAccomplishment is empty", () => {
    const input: InitialReportSubmissionInput = {
      reportId: "report-001",
      engineerId: "engineer-001",
      yesterdayAccomplishment: "",
      todayPlan: "本日のタスクを実施する予定です",
      issuesAndConcerns: "システム統合テストの実施時間確保が課題です",
      submissionTimestamp: new Date("2024-01-15T09:00:00Z"),
      trainingPhaseId: "phase-001",
    };

    expect(() => evaluateInitialReportSubmission(input)).toThrow(
      /必須項目/
    );
  });
});