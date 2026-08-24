import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信機能", () => {
  // SCEN-309: [normal] 日報入力フォーム検証機能 - 抱えている課題が空白でなく文字数制限内のとき検証を通す
  test("should validate and accept daily report when challenges field contains valid text within character limit", () => {
    // Arrange: テスト用入力データの準備
    const validInput: SubmitDailyReportInput = {
      userId: "engineer-001",
      teamId: "team-a",
      yesterdayAccomplishment: "APIエンドポイントの実装を完了した",
      todayPlan: "ユニットテストの作成を進める",
      challenges: "ログイン機能のバグ対応",
      reportDate: "2024-01-15",
    };

    // Act: submitDailyReport 関数を実行
    const result: SubmitDailyReportOutput = submitDailyReport(validInput);

    // Assert: 検証が成功し、正常な出力を確認
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionTimestamp).toBeDefined();
    expect(result.isWithinDeadline).toBe(true);
  });
});