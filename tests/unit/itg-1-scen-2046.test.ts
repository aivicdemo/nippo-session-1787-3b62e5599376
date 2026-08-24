import { submitDailyReport, type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信", () => {
  // SCEN-2046: [error] 対策案・実行計画の必須項目検証 - 実行予算額が数値として解析不可のとき検証エラーになる
  test("should reject submission when budget amount is non-numeric", () => {
    const input: SubmitDailyReportInput = {
      userId: "user-001",
      teamId: "team-A",
      yesterdayAccomplishment: "システムのデバッグを完了しました",
      todayPlan: "新機能の実装を開始します",
      challenges: "パフォーマンス改善が必要です",
      reportDate: "2024-01-15",
      budgetAmount: "abc123"
    };

    expect(() => submitDailyReport(input)).toThrow(/予算額/);
  });
});