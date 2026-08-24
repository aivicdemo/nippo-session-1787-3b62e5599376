import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信", () => {
  // SCEN-2525
  test("初回テスト報告の入力検証 - 課題の重要度レベルが欠落しているときエラーが返される", () => {
    const input = {
      userId: "engineer-001",
      teamId: "team-a",
      yesterdayAccomplishment: "データベース最適化を実施し、クエリ応答時間を15%削減",
      todayPlan: "APIエンドポイントのテストを完了させる予定",
      challenges: "データベース接続タイムアウト",
      reportDate: "2024-01-15",
      hasChallengeFlag: true,
      challengeContent: "データベース接続タイムアウト",
      issueSeverityLevel: undefined,
    };

    expect(() => submitDailyReport(input)).toThrow(/重要度レベル/);
  });
});