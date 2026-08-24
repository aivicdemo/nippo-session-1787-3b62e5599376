import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("Monthly Performance Analysis - extractMonthlyReportData", () => {
  // SCEN-1763
  test("should include reports submitted before 23:59:59 boundary and exclude reports from next day", async () => {
    const extractionPeriodStart = "2024-01-01T00:00:00Z";
    const extractionPeriodEnd = "2024-01-31T23:59:59Z";

    const testReports = [
      {
        id: "report-1",
        userId: "user-1",
        teamId: "team-1",
        submittedAt: "2024-01-31T23:59:30Z",
        yesterday: "タスクA完了",
        today: "タスクD予定",
        issue: "問題なし",
      },
      {
        id: "report-2",
        userId: "user-2",
        teamId: "team-1",
        submittedAt: "2024-01-31T23:59:59Z",
        yesterday: "タスクB完了",
        today: "タスクE予定",
        issue: "軽微な問題",
      },
      {
        id: "report-3",
        userId: "user-3",
        teamId: "team-1",
        submittedAt: "2024-02-01T00:00:00Z",
        yesterday: "タスクC完了",
        today: "タスクF予定",
        issue: "問題なし",
      },
    ];

    const input: Parameters<typeof extractMonthlyReportData>[0] = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: "user-admin",
      teamIdFilter: undefined,
    };

    const result = await extractMonthlyReportData(input);

    expect(result.extractionPeriodStart).toBe(extractionPeriodStart);
    expect(result.extractionPeriodEnd).toBe(extractionPeriodEnd);
    expect(result.totalReportCount).toBe(2);
    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0].reportCount).toBe(2);

    const reportIds = result.reportsByTeam[0].reportIds;
    expect(reportIds).toContain("report-1");
    expect(reportIds).toContain("report-2");
    expect(reportIds).not.toContain("report-3");
  });
});