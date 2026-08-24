import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("朝会報告の入力値検証機能", () => {
  // SCEN-2222
  test("3つの報告項目うち1つが空文字列の場合、該当項目にエラーメッセージが表示される", () => {
    const input = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "",
      todayPlan: "タスクA実施",
      challenges: "課題B対応",
      reportDate: "2024-01-15",
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(/昨日やったこと/);
    expect(result.errors.length).toBe(1);
  });
});