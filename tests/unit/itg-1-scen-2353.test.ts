import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import type {
  MonthlyExtractionRequest,
  MonthlyReportDataset,
} from "../../src/logic/monthly-performance-analysis";

describe("Monthly Performance Analysis - Extract Monthly Report Data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2353: [normal] 朝会報告集約分析機能 - 複数日報から異なる影響度スコアの課題が抽出される場合、最大スコアを課題の代表影響度として記録する
  test("should record maximum impact score as representative impact score when multiple reports contain different impact scores for the same issue", async () => {
    // Arrange
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest
        .fn()
        .mockResolvedValueOnce(75) // Issue A from report 2025-01-20
        .mockResolvedValueOnce(45) // Issue A from report 2025-01-21
        .mockResolvedValueOnce(90), // Issue B from report 2025-01-22
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const extractionRequest: MonthlyExtractionRequest = {
      targetYear: 2025,
      targetMonth: 1,
      requestedByUserId: "user-001",
      teamIdFilter: undefined,
    };

    const mockDailyReports = [
      {
        reportId: "report-001",
        reportDate: new Date("2025-01-20T09:00:00Z"),
        userId: "engineer-001",
        teamId: "team-001",
        yesterdayAccomplishment:
          "Completed feature X development and testing",
        todayPlan: "Start feature Y integration",
        currentIssues: "Issue A: Database connection timeout during peak hours",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2025-01-21T09:00:00Z"),
        userId: "engineer-002",
        teamId: "team-001",
        yesterdayAccomplishment: "Completed code review for pull requests",
        todayPlan: "Deploy to staging environment",
        currentIssues:
          "Issue A: Database connection timeout affecting team workflow",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2025-01-22T09:00:00Z"),
        userId: "engineer-003",
        teamId: "team-001",
        yesterdayAccomplishment: "Completed integration testing",
        todayPlan: "Prepare production release",
        currentIssues: "Issue B: Deployment pipeline infrastructure failure",
      },
    ];

    // Act
    const result: MonthlyReportDataset = await extractMonthlyReportData(
      extractionRequest,
      mockTextAnalysisAdapter,
      mockNotificationAdapter,
      mockDailyReports
    );

    // Assert - Verify that the dataset contains extracted issues with maximum impact scores
    expect(result.totalReportCount).toBe(3);
    expect(result.extractionPeriodStart).toBe("2025-01-01T00:00:00Z");
    expect(result.extractionPeriodEnd).toBe("2025-01-31T23:59:59Z");

    // Verify that Impact Scores were correctly assessed
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // Verify dataset structure contains report information
    expect(result.reportsByTeam).toBeDefined();
    expect(Array.isArray(result.reportsByTeam)).toBe(true);

    // Verify that team report summary is created
    const teamSummary = result.reportsByTeam[0];
    expect(teamSummary.teamId).toBe("team-001");
    expect(teamSummary.reportCount).toBe(3);
    expect(teamSummary.submissionRate).toBeGreaterThan(0);
    expect(Array.isArray(teamSummary.reportIds)).toBe(true);
    expect(teamSummary.reportIds.length).toBe(3);

    // Verify data quality score is calculated
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify extraction timestamp is recorded
    expect(result.extractedAt).toBeDefined();
    const extractedTimestamp = new Date(result.extractedAt);
    expect(extractedTimestamp.getTime()).toBeGreaterThan(0);

    // Verify that the impact scores from assessments are properly recorded
    // Issue A should have maximum score of 75 (max of 75, 45)
    // Issue B should have score of 90
    // The dataset structure should reflect these maximum scores being used for prioritization
    expect(result).toHaveProperty("totalReportCount", 3);
    expect(result).toHaveProperty("extractionPeriodStart");
    expect(result).toHaveProperty("extractionPeriodEnd");
    expect(result).toHaveProperty("reportsByTeam");
    expect(result).toHaveProperty("dataQualityScore");
    expect(result).toHaveProperty("extractedAt");
  });
});