import { describe, test, expect } from "@jest/globals";
import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";

describe("ダッシュボードデータの鮮度確認機能", () => {
  // SCEN-1045
  test("displayTimeがnullのとき、ダッシュボード鮮度確認がエラーをスロー", () => {
    const input = {
      userId: "user-001",
      teamId: "team-001",
      reportDate: "2024-01-15",
      maxStalenessSeconds: 300,
    };

    const freshnessData = {
      isDataFresh: false,
      lastUpdateTimestamp: "2024-01-15T08:00:00Z",
      displayTimestamp: null as unknown as string,
      stalenessSeconds: 450,
    };

    expect(() => {
      ensureDashboardDataFreshness(input, freshnessData);
    }).toThrow(/displayTime|表示時刻|null/);
  });
});