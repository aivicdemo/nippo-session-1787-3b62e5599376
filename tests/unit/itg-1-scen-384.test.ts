import { prepareDashboardData } from "../../src/logic/dashboard-presentation";

describe("朝会報告管理システム - ダッシュボード表示用データ準備", () => {
  test("SCEN-384: アクセス時刻が未来の場合、エラーを発生させる", () => {
    const baseTime = new Date("2024-01-15T09:00:00Z");
    const futureTargetDate = new Date(baseTime.getTime() + 60 * 60 * 1000);
    const teamId = "team-001";
    const requestingUserId = "user-dept-manager-001";
    const includeHistoricalTrend = false;

    expect(() => {
      prepareDashboardData(
        teamId,
        futureTargetDate,
        requestingUserId,
        includeHistoricalTrend
      );
    }).toThrow(/アクセス時刻/);
  });
});