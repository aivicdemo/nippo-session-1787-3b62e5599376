import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信", () => {
  // SCEN-333: [edge] 日報入力バリデーション機能 - 今日やることが文字数制限上限を1文字超過するとき該当項目がエラー表示される
  test("todayPlanが101文字（上限100+1）のときバリデーションエラーを返す", () => {
    const todayPlanExceededText = "あ".repeat(101);
    const input = {
      userId: "user-001",
      teamId: "team-A",
      yesterdayAccomplishment: "昨日の実績サンプルテキスト",
      todayPlan: todayPlanExceededText,
      challenges: "抱えている課題サンプルテキスト",
      reportDate: "2024-01-15",
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: "todayPlan",
        errorCode: "ExceedsCharacterLimit",
        message: expect.stringMatching(/文字数.*上限/),
      })
    );
  });
});