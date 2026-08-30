import { prepareDashboardData, type DashboardDataPrepareInput } from "../../src/logic/dashboard-presentation";

describe("Dashboard Presentation", () => {
  test("SCEN-064: prepareDashboardData throws InsufficientPermissionError when requesting user lacks manager role", () => {
    const input: DashboardDataPrepareInput = {
      teamId: "team-001",
      targetDate: new Date("2024-01-15T09:00:00Z"),
      requestingUserId: "user-engineer-001",
      includeHistoricalTrend: false,
    };

    expect(() => prepareDashboardData(input)).toThrow(/権限/);
  });
});