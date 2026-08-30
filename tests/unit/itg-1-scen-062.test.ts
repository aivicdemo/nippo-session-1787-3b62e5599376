import { prepareDashboardData, type DashboardDataPrepareInput } from "../../src/logic/dashboard-presentation";

describe("朝会報告管理システム - ダッシュボード表示データ準備", () => {
  // SCEN-062
  test("指定されたチームIDが存在しないか無効な場合、InvalidTeamIdErrorが発生する", async () => {
    const input: DashboardDataPrepareInput = {
      teamId: "invalid-team-999",
      targetDate: new Date("2024-01-15"),
      requestingUserId: "user-001",
      includeHistoricalTrend: false,
    };

    await expect(() => prepareDashboardData(input)).rejects.toThrow(/チーム/);
  });
});