import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateMonthlyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-136: [error] 月次レポート生成から分析完了までの自動実行 AIエージェント - 新規の課題カテゴリが出現した場合に副作用の確定前に人へ引き継ぐ
  test("should escalate when new issue category detected during analysis and not finalize director submission", async () => {
    const mockAiClient = {
      action01ExtractMonthlyData: jest.fn().mockResolvedValue({
        successFlag: true,
        extractedReportCount: 45,
        unsubmittedMembers: ["member-005", "member-012"],
      }),
      action02IdentifyNonSubmitters: jest.fn().mockResolvedValue({
        successFlag: true,
        nonSubmitterList: ["member-005", "member-012"],
        reminderSentCount: 2,
      }),
      action03CalculateProductivityMetrics: jest.fn().mockResolvedValue({
        successFlag: true,
        metricsCalculated: {
          issueCountByTeam: {
            "team-A": 12,
            "team-B": 18,
            "team-C": 15,
          },
          avgResolutionDays: 4.2,
          completionRate: 0.87,
        },
      }),
      action04AnalyzeTimeSeriesChanges: jest.fn().mockResolvedValue({
        successFlag: true,
        timeSeriesAnalysis: {
          weeklyTrend: [
            { week: 1, issueCount: 8 },
            { week: 2, issueCount: 10 },
            { week: 3, issueCount: 12 },
            { week: 4, issueCount: 15 },
          ],
          isIncreasingTrend: true,
        },
      }),
      action05IdentifyBottlenecks: jest.fn().mockResolvedValue({
        successFlag: true,
        bottleneckAnalysis: {
          topBottlenecks: [
            { category: "bug", occurrenceCount: 20, avgDelay: 2.1 },
            { category: "performance", occurrenceCount: 15, avgDelay: 1.8 },
          ],
          shiftPatterns: [
            {
              period: "week-1-to-2",
              shift: "bug_increase",
              percentageChange: 25,
            },
          ],
        },
      }),
      action06AnalyzeTeamPerformance: jest.fn().mockResolvedValue({
        successFlag: true,
        teamPerformanceMetrics: {
          "team-A": {
            issueCount: 12,
            avgResolutionDays: 3.5,
            completionRate: 0.92,
          },
          "team-B": {
            issueCount: 18,
            avgResolutionDays: 4.8,
            completionRate: 0.83,
          },
          "team-C": {
            issueCount: 15,
            avgResolutionDays: 4.1,
            completionRate: 0.88,
          },
        },
      }),
      action07RankAndSummarize: jest.fn().mockResolvedValue({
        successFlag: false,
        escalationDetected: true,
        escalationType: "new_category_detected",
        detectedNewCategory: "security-vulnerability",
        partialResults: {
          timeSeriesAnalysis: {
            weeklyTrend: [
              { week: 1, issueCount: 8 },
              { week: 2, issueCount: 10 },
              { week: 3, issueCount: 12 },
              { week: 4, issueCount: 15 },
            ],
          },
          bottleneckAnalysis: {
            topBottlenecks: [
              { category: "bug", occurrenceCount: 20, avgDelay: 2.1 },
              { category: "performance", occurrenceCount: 15, avgDelay: 1.8 },
            ],
          },
          teamPerformanceMetrics: {
            "team-A": {
              issueCount: 12,
              avgResolutionDays: 3.5,
              completionRate: 0.92,
            },
            "team-B": {
              issueCount: 18,
              avgResolutionDays: 4.8,
              completionRate: 0.83,
            },
            "team-C": {
              issueCount: 15,
              avgResolutionDays: 4.1,
              completionRate: 0.88,
            },
          },
        },
      }),
    };

    const mockDatabaseClient = {
      insertEscalationRecord: jest
        .fn()
        .mockResolvedValue({ escalationId: "esc-001" }),
      updateReportStatus: jest.fn().mockResolvedValue({ success: true }),
      insertAuditLog: jest.fn().mockResolvedValue({ logId: "audit-001" }),
    };

    const mockNotificationClient = {
      sendDirectorNotification: jest
        .fn()
        .mockResolvedValue({ notificationId: "notif-001" }),
    };

    const monthlyReportInput = {
      reportPeriod: "2024-01-01_to_2024-01-31",
      targetYear: 2024,
      targetMonth: 1,
      organizationId: "org-001",
      directorEmail: "director@company.example.com",
      knownCategoryList: ["bug", "performance", "specification-change"],
    };

    const result = await generateMonthlyAnalysisReport(
      monthlyReportInput,
      mockAiClient,
      mockDatabaseClient,
      mockNotificationClient
    );

    expect(result.escalationOccurred).toBe(true);
    expect(result.escalationType).toBe("new_category_detected");
    expect(result.detectedNewCategory).toBe("security-vulnerability");

    expect(result.escalationRecord).toMatchObject({
      escalation_type: "new_category_detected",
      detected_category: "security-vulnerability",
      status: "awaiting_human_review",
      partial_results: expect.objectContaining({
        timeSeriesAnalysis: expect.any(Object),
        bottleneckAnalysis: expect.any(Object),
        teamPerformanceMetrics: expect.any(Object),
      }),
    });

    expect(mockDatabaseClient.insertEscalationRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        escalation_type: "new_category_detected",
        detected_category: "security-vulnerability",
        status: "awaiting_human_review",
        partial_results: expect.any(Object),
      })
    );

    expect(mockDatabaseClient.updateReportStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: expect.any(String),
        newStatus: "partial_analysis_completed_awaiting_review",
      })
    );

    expect(mockNotificationClient.sendDirectorNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        directorEmail: "director@company.example.com",
        subject: expect.stringContaining("新規課題カテゴリ"),
        body: expect.stringContaining("新規カテゴリ検出のため分析結果確認待ち"),
      })
    );

    expect(mockDatabaseClient.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ESCALATION_TRIGGERED",
        escalationType: "new_category_detected",
        detectedCategory: "security-vulnerability",
        reportPeriod: "2024-01-01_to_2024-01-31",
      })
    );

    expect(result.directorSubmissionFinalized).toBe(false);
    expect(result.action08ExecutedFlag).toBe(false);
  });
});