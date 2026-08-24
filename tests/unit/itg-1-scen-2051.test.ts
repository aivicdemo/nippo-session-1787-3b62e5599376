import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("課題の優先度を色分けで表示するダッシュボード機能", () => {
  // SCEN-2051
  test("対策案テキストが最大文字数を1文字超えた場合にバリデーションエラーを返す", () => {
    const maxCountermeasureLength = 500;
    const countermeasureWith501Chars = "a".repeat(maxCountermeasureLength + 1);

    const input = {
      userId: "engineer-001",
      teamId: "team-001",
      yesterdayAccomplishment: "completed task A",
      todayPlan: "plan task B",
      challenges: "facing issue X",
      reportDate: "2024-01-15",
      countermeasure: countermeasureWith501Chars,
    };

    expect(() => submitDailyReport(input)).toThrow(/500文字以内/);
  });
});