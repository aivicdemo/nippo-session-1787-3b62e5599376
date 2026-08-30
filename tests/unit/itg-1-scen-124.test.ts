import { describe, test, expect, jest } from "@jest/globals";
import { evaluateInitialReportSubmission } from "../../src/logic/adoption-training-management";

describe("朝会報告管理システム - 初回テスト報告評価", () => {
  test("SCEN-124: 報告内容の品質スコアが基準値未満の場合、エラーをスロー", () => {
    const reportId = "RPT-001";
    const engineerId = "ENG-123";
    const yesterdayAccomplishment = "昨日の実績";
    const todayPlan = "今日の予定";
    const issuesAndConcerns = "課題・懸念事項";
    const submissionTimestamp = new Date("2024-01-15T09:00:00Z");
    const trainingPhaseId = "PHASE-001";

    const input = {
      reportId,
      engineerId,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
      submissionTimestamp,
      trainingPhaseId,
    };

    expect(() => {
      evaluateInitialReportSubmission(input);
    }).toThrow(/品質/);
  });
});