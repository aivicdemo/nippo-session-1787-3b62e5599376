import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信機能", () => {
  test("SCEN-338: 日報入力バリデーション機能 - 3項目すべてが空文字列のとき3項目すべてがエラー表示される", () => {
    // Arrange: 3つの入力フィールドすべてを空文字列で初期化
    const input = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "",
      todayPlan: "",
      challenges: "",
      reportDate: "2024-01-15",
    };

    // Act & Assert: submitDailyReport を呼び出し、検証結果を確認
    const result = submitDailyReport(input);

    // 期待結果: 3項目すべてに対してバリデーションエラーが発生
    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toContain(
      expect.stringMatching(/昨日やったこと.*必須/)
    );
    expect(result.errors).toContain(
      expect.stringMatching(/今日やること.*必須/)
    );
    expect(result.errors).toContain(expect.stringMatching(/抱えている課題.*必須/));
    expect(result.errors.length).toBe(3);
  });
});