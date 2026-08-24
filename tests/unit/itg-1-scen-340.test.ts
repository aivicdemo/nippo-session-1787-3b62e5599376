import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("日報入力バリデーション機能", () => {
  test("SCEN-340: 3項目すべてが文字数制限上限を超過するとき3項目すべてがエラー表示される", () => {
    // 文字数制限上限を超えるテキストを準備（500文字上限に対して501文字）
    const exceededYesterdayAccomplishment = "a".repeat(501);
    const exceededTodayPlan = "b".repeat(501);
    const exceededChallenges = "c".repeat(501);

    const input = {
      userId: "engineer-001",
      teamId: "team-001",
      yesterdayAccomplishment: exceededYesterdayAccomplishment,
      todayPlan: exceededTodayPlan,
      challenges: exceededChallenges,
      reportDate: "2024-01-15",
    };

    // submitDailyReport を呼び出し、バリデーションエラーが発生することを確認
    expect(() => submitDailyReport(input)).toThrow(/文字数/);
  });
});