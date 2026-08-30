import { prepareDashboardData } from "../../src/logic/dashboard-presentation";
import { type DashboardDataPrepareInput } from "../../src/logic/dashboard-presentation";

describe("朝会報告管理システム - ダッシュボード表示準備", () => {
  // SCEN-616: [error] 課題キーワードが空文字列または null のとき
  test("should throw error when issue keyword is empty string", async () => {
    const teamId = "team-001";
    const targetDate = new Date("2024-01-15T09:00:00Z");
    const requestingUserId = "user-001";

    const input: DashboardDataPrepareInput = {
      teamId,
      targetDate,
      requestingUserId,
      includeHistoricalTrend: false,
    };

    // issueFrequencyMap に空文字列をキーとして含める
    const issueFrequencyMap = new Map<string, number>([
      ["", 5],
      ["バグ", 3],
    ]);

    // reportList に issues フィールドに空文字列を含む Report オブジェクトを用意
    const reportList = [
      {
        reportId: "report-001",
        engineerId: "eng-001",
        submittedAt: new Date("2024-01-15T08:00:00Z"),
        yesterday: "実装作業を実施",
        today: "テスト実施予定",
        issues: "",
      },
    ];

    // prepareDashboardData を呼び出して例外がスローされることを確認
    await expect(() =>
      prepareDashboardData(
        input,
        issueFrequencyMap,
        reportList
      )
    ).toThrow(/課題内容が不正/);
  });
});