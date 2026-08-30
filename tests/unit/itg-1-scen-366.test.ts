import { prepareDashboardData } from "../../src/logic/dashboard-presentation";

describe("朝会報告管理システム - ダッシュボード表示データ準備", () => {
  // SCEN-366
  test("チーム日報データが空である場合に例外を発生させる", () => {
    const teamId = "team-001";
    const targetDate = new Date("2025-01-15T00:00:00Z");
    const requestingUserId = "user-manager-001";
    const includeHistoricalTrend = false;

    expect(() =>
      prepareDashboardData({
        teamId,
        targetDate,
        requestingUserId,
        includeHistoricalTrend,
      })
    ).toThrow(/日報データが見つかりません/);
  });
});