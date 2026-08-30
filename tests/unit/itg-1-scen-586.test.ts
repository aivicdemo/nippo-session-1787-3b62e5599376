import { describe, test, expect } from "@jest/globals";
import { evaluateInitialReportSubmission } from "../../src/logic/adoption-training-management";

describe("朝会報告管理システム - 初回テスト報告評価", () => {
  test("SCEN-586: 入力テキストに制御文字やスクリプトタグが含まれるとき FormatValidationError をスロー", () => {
    const reportId = "RPT-586-001";
    const engineerId = "ENG-001";
    const yesterdayAccomplishment =
      '<script>alert("xss")</script>昨日は機能Aの実装を完了';
    const todayPlan =
      '本日は<img src=x onerror=alert(1)>テスト実施予定';
    const issuesAndConcerns =
      "課題: データベース接続 エラーが発生中";
    const submissionTimestamp = new Date("2024-01-15T10:30:00Z");
    const trainingPhaseId = "PHASE-001";

    expect(() =>
      evaluateInitialReportSubmission({
        reportId,
        engineerId,
        yesterdayAccomplishment,
        todayPlan,
        issuesAndConcerns,
        submissionTimestamp,
        trainingPhaseId,
      })
    ).toThrow(/入力形式が不正です/);
  });
});