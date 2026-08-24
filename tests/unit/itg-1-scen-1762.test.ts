import { describe, test, expect } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyReportDataset } from "../../src/logic/monthly-performance-analysis";

describe("Monthly Report Data Extraction", () => {
  // SCEN-1762: [normal] 月次レポート生成データ抽出機能 - 抽出対象期間の00:00境界時刻直後のデータが正しく含まれる
  test("should include data from exactly 1 second after period start and exclude data from period start boundary", () => {
    const targetYear = 2026;
    const targetMonth = 1;
    const periodStartISO = "2026-01-01T00:00:00Z";
    const periodEndISO = "2026-01-31T23:59:59Z";

    const dataAtBoundaryStart = {
      reportId: "report-boundary-start",
      reportContent: {
        yesterdayAccomplishments: "Previous day task response",
        todayPlans: "New task confirmation",
        currentIssues: "Network latency"
      },
      submittedAt: "2026-01-01T00:00:00Z",
      teamId: "team-001",
      userId: "user-001"
    };

    const dataAfterBoundaryStart1 = {
      reportId: "report-after-boundary-1",
      reportContent: {
        yesterdayAccomplishments: "Previous day task response",
        todayPlans: "New task confirmation",
        currentIssues: "Network latency"
      },
      submittedAt: "2026-01-01T00:00:01Z",
      teamId: "team-001",
      userId: "user-001"
    };

    const dataAfterBoundaryStart2 = {
      reportId: "report-after-boundary-2",
      reportContent: {
        yesterdayAccomplishments: "Previous day task response",
        todayPlans: "New task confirmation",
        currentIssues: "Network latency"
      },
      submittedAt: "2026-01-01T00:15:00Z",
      teamId: "team-001",
      userId: "user-001"
    };

    const mockInput = {
      targetYear,
      targetMonth,
      requestedByUserId: "user-admin-001",
      teamIdFilter: undefined
    };

    const mockReportRecords = [
      dataAtBoundaryStart,
      dataAfterBoundaryStart1,
      dataAfterBoundaryStart2
    ];

    const result: MonthlyReportDataset = extractMonthlyReportData(
      mockInput,
      mockReportRecords
    );

    expect(result.extractionPeriodStart).toBe(periodStartISO);
    expect(result.extractionPeriodEnd).toBe(periodEndISO);
    expect(result.totalReportCount).toBe(2);

    const extractedReportIds = result.reportsByTeam
      .flatMap((teamSummary) => teamSummary.reportIds);

    expect(extractedReportIds).toContain("report-after-boundary-1");
    expect(extractedReportIds).toContain("report-after-boundary-2");
    expect(extractedReportIds).not.toContain("report-boundary-start");

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();
  });
});