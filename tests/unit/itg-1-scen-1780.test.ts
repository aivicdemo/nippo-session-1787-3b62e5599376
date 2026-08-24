import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import type {
  MonthlyReportDataset,
  TeamReportSummary,
} from "../../src/logic/monthly-performance-analysis";

describe("monthly-performance-analysis: extractMonthlyReportData", () => {
  // SCEN-1780: [edge] 月次レポート生成機能 - 前月が2月でうるう年の場合、2月29日23:59ちょうどの報告を含める
  test("should include report submitted exactly at Feb 29 23:59 in leap year when generating monthly report for March", async () => {
    const leapYear = 2024;
    const februaryDateString = `${leapYear}-02-29T23:59:00Z`;
    const februaryDate = new Date(februaryDateString);

    const reportIdFeb29 = "report-leap-day-1";
    const teamIdA = "team-001";
    const userIdA = "user-001";

    const mockReportData = [
      {
        reportId: reportIdFeb29,
        teamId: teamIdA,
        userId: userIdA,
        submittedAt: februaryDate,
        yesterdayAccomplishment:
          "Fixed critical bug in authentication module",
        todayPlan: "Implement user profile feature",
        currentIssues: "Database connection timeout during peak hours",
      },
      {
        reportId: "report-feb-01",
        teamId: teamIdA,
        userId: userIdA,
        submittedAt: new Date(`${leapYear}-02-01T08:00:00Z`),
        yesterdayAccomplishment: "Team sync meeting",
        todayPlan: "Code review",
        currentIssues: "None",
      },
      {
        reportId: "report-feb-15",
        teamId: teamIdA,
        userId: userIdA,
        submittedAt: new Date(`${leapYear}-02-15T09:00:00Z`),
        yesterdayAccomplishment: "Unit tests completed",
        todayPlan: "Integration testing",
        currentIssues: "Test environment unstable",
      },
    ];

    const targetYear = leapYear;
    const targetMonth = 3;

    const stubTextAnalysisClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          "authentication",
          "database",
          "timeout",
          "testing",
          "environment",
        ],
        frequencies: [2, 1, 1, 2, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 72,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "high",
      }),
    };

    const stubNotificationClient = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: "sched-123",
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveryStatus: "delivered",
      }),
    };

    const extractionPeriodStartExpected = `${leapYear}-02-01T00:00:00Z`;
    const extractionPeriodEndExpected = `${leapYear}-02-29T23:59:59Z`;
    const expectedReportCountIncludingLeapDay = 3;

    const result: MonthlyReportDataset = await extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId: userIdA,
        teamIdFilter: [teamIdA],
      },
      stubTextAnalysisClient,
      stubNotificationClient,
      mockReportData
    );

    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe(extractionPeriodStartExpected);
    expect(result.extractionPeriodEnd).toBe(extractionPeriodEndExpected);
    expect(result.totalReportCount).toBe(expectedReportCountIncludingLeapDay);

    const teamSummary: TeamReportSummary | undefined = result.reportsByTeam.find(
      (summary) => summary.teamId === teamIdA
    );
    expect(teamSummary).toBeDefined();
    expect(teamSummary!.reportCount).toBe(expectedReportCountIncludingLeapDay);
    expect(teamSummary!.reportIds).toContain(reportIdFeb29);
    expect(teamSummary!.reportIds).toContain("report-feb-01");
    expect(teamSummary!.reportIds).toContain("report-feb-15");
    expect(teamSummary!.submissionRate).toBeGreaterThanOrEqual(0);
    expect(teamSummary!.submissionRate).toBeLessThanOrEqual(100);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.extractedAt).toBeDefined();
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate instanceof Date).toBe(true);
    expect(extractedAtDate.getTime()).not.toBeNaN();

    const leapDayReportIncluded = result.reportsByTeam.some((summary) =>
      summary.reportIds.includes(reportIdFeb29)
    );
    expect(leapDayReportIncluded).toBe(true);

    expect(stubTextAnalysisClient.extractKeywords).toHaveBeenCalled();
    expect(stubTextAnalysisClient.assessImpactScore).toHaveBeenCalled();
    expect(stubTextAnalysisClient.classifyIssueSeverity).toHaveBeenCalled();

    const februaryOneDateString = `${leapYear}-02-01`;
    const februaryTwentyNinethString = `${leapYear}-02-29`;

    for (const report of mockReportData) {
      const reportDateString = report.submittedAt.toISOString().split("T")[0];
      const isWithinFebuary =
        reportDateString >= februaryOneDateString &&
        reportDateString <= februaryTwentyNinethString;
      expect(isWithinFebuary).toBe(true);
    }

    expect(result.reportsByTeam.length).toBeGreaterThan(0);
    for (const teamSummary of result.reportsByTeam) {
      expect(teamSummary.teamId).toBeDefined();
      expect(typeof teamSummary.teamId).toBe("string");
      expect(teamSummary.reportCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(teamSummary.reportIds)).toBe(true);
    }
  });
});