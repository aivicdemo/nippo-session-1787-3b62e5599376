import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  // SCEN-170: [error] 日報集約から分析報告までの自動実行エージェント AIエージェント - 「日報集約から分析報告までの自動実行エージェント」が「システム連携エラーが発生した場合」の場合に副作用の確定前に人へ引き継ぐ
  test("should stop before side effect confirmation and escalate to manager on system integration error", async () => {
    const mockAiClient = {
      action01_aggregateDailyReports: jest
        .fn()
        .mockResolvedValue({
          aggregatedReportIds: ["report_001", "report_002"],
          totalReports: 2,
          aggregationTimestamp: new Date("2024-01-15T09:00:00Z"),
        }),
      action02_identifyUnsubmitted: jest.fn().mockResolvedValue({
        unsubmittedMembers: ["member_003", "member_004"],
        unsubmittedCount: 2,
        identificationTimestamp: new Date("2024-01-15T09:15:00Z"),
      }),
      action03_sendReminderNotifications: jest.fn().mockResolvedValue({
        sentNotificationIds: ["notif_001", "notif_002"],
        notificationCount: 2,
        sendTimestamp: new Date("2024-01-15T09:30:00Z"),
      }),
      action04_quantifyProductivityMetrics: jest.fn().mockResolvedValue({
        metricsData: {
          averageResolutionTime: 2.5,
          responseRate: 0.88,
          taskCompletionRate: 0.92,
        },
        calculationTimestamp: new Date("2024-01-15T09:45:00Z"),
      }),
      action05_classifyIssuesByPriority: jest.fn().mockRejectedValue(
        new Error(
          "System integration error: External API connection timeout after 30s. Service: jira-api. Please check network connectivity and API service status."
        )
      ),
      action06_proposeImprovementMeasures: jest.fn(),
      action07_generateReportAndPresent: jest.fn(),
      action08_logEscalationEvent: jest.fn().mockResolvedValue({
        escalationId: "esc_sys_001",
        escalationStatus: "pending_manual_review",
        escalationTimestamp: new Date("2024-01-15T10:00:00Z"),
      }),
      action09_performRollback: jest.fn().mockResolvedValue({
        rollbackStatus: "completed",
        rollbackTargets: ["agg_data_001", "notif_001", "notif_002"],
        rollbackTimestamp: new Date("2024-01-15T10:05:00Z"),
      }),
      action10_notifyManagerEscalation: jest.fn().mockResolvedValue({
        notificationId: "escal_notif_001",
        recipientEmail: "manager@company.com",
        notificationTimestamp: new Date("2024-01-15T10:10:00Z"),
        message:
          "System integration error detected. Manual review required. Escalation ID: esc_sys_001",
      }),
    };

    const aggregationInput = {
      aggregationPeriodStartDate: new Date("2024-01-08T00:00:00Z"),
      aggregationPeriodEndDate: new Date("2024-01-15T23:59:59Z"),
      targetTeamIds: ["team_alpha", "team_beta"],
      memberList: [
        "member_001",
        "member_002",
        "member_003",
        "member_004",
      ],
      managerId: "mgr_001",
      managerEmail: "manager@company.com",
    };

    const result = await detectAndNotifyUnsubmitted(
      aggregationInput,
      mockAiClient as any
    );

    expect(result).toBeDefined();
    expect(result.escalationStatus).toBe("pending_manual_review");
    expect(result.errorType).toBe("system_integration_error");
    expect(result.rollbackCandidates).toEqual([
      "agg_data_001",
      "notif_001",
      "notif_002",
    ]);

    expect(mockAiClient.action01_aggregateDailyReports).toHaveBeenCalledWith(
      aggregationInput
    );
    expect(mockAiClient.action02_identifyUnsubmitted).toHaveBeenCalled();
    expect(mockAiClient.action03_sendReminderNotifications).toHaveBeenCalled();
    expect(
      mockAiClient.action04_quantifyProductivityMetrics
    ).toHaveBeenCalled();
    expect(mockAiClient.action05_classifyIssuesByPriority).toHaveBeenCalled();

    expect(
      mockAiClient.action06_proposeImprovementMeasures
    ).not.toHaveBeenCalled();
    expect(
      mockAiClient.action07_generateReportAndPresent
    ).not.toHaveBeenCalled();

    expect(mockAiClient.action08_logEscalationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: "system_integration_error",
        escalationTrigger: "System integration error",
      })
    );

    expect(mockAiClient.action09_performRollback).toHaveBeenCalledWith(
      expect.objectContaining({
        rollbackTargets: ["agg_data_001", "notif_001", "notif_002"],
      })
    );

    expect(mockAiClient.action10_notifyManagerEscalation).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "manager@company.com",
        escalationId: "esc_sys_001",
        escalationStatus: "pending_manual_review",
      })
    );

    expect(result.reportGenerated).toBe(false);
    expect(result.reportPresentationCompleted).toBe(false);
    expect(result.partialSideEffectsConfirmed).toBe(false);

    expect(result.escalationNotificationLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipientEmail: "manager@company.com",
          notificationId: "escal_notif_001",
          timestamp: new Date("2024-01-15T10:10:00Z"),
        }),
      ])
    );
  });
});