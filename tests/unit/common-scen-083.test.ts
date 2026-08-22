import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-083: system integration error during real-time data aggregation triggers handoff to human before side effects are confirmed", async () => {
    const mockAiClient = {
      action01GetRealtimeProgressData: jest.fn(),
      action02ExtractAndClassifyIssues: jest.fn(),
      action03EvaluateRereleaseRisk: jest.fn(),
      action04AutoPrioritizeIssues: jest.fn(),
      action05GenerateRecommendedActions: jest.fn(),
      action06CreateMorningMeetingDashboard: jest.fn(),
      action07ExtractAndNotifyUnsubmittedMembers: jest.fn(),
    };

    const mockNotificationService = {
      sendAdminHandoffNotification: jest.fn(),
      sendUnsubmittedReminder: jest.fn(),
      createMorningDashboard: jest.fn(),
    };

    const mockAuditLogger = {
      logEscalation: jest.fn(),
      logTransactionStateChange: jest.fn(),
    };

    const mockTransactionManager = {
      setTransactionState: jest.fn(),
      getTransactionState: jest.fn(),
    };

    const escalationErrorCode = "SYSTEM_INTEGRATION_ERROR";
    const failedSystemName = "dashboard_api";
    const errorTimestamp = new Date("2024-01-15T08:30:00Z").toISOString();
    const requestId = "req_tx4_imp1_20240115_083000_uuid";

    mockAiClient.action01GetRealtimeProgressData.mockRejectedValueOnce(
      new Error(
        `HTTP 503: Failed to connect to ${failedSystemName} at ${errorTimestamp}`
      )
    );

    mockTransactionManager.getTransactionState.mockResolvedValueOnce({
      status: "in_progress",
      requestId: requestId,
      createdAt: new Date("2024-01-15T08:25:00Z").toISOString(),
    });

    const result = await sendUnsubmittedReminder(
      { requestId: requestId },
      mockAiClient as any,
      mockNotificationService as any,
      mockAuditLogger as any,
      mockTransactionManager as any
    );

    expect(result).toEqual({
      success: false,
      escalated: true,
      escalationReason: "SYSTEM_INTEGRATION_ERROR",
      escalationDetails: {
        failedSystem: failedSystemName,
        errorTimestamp: errorTimestamp,
        requestId: requestId,
      },
    });

    expect(mockTransactionManager.setTransactionState).toHaveBeenCalledWith(
      requestId,
      "review_awaiting"
    );

    expect(mockAuditLogger.logEscalation).toHaveBeenCalledWith({
      escalationType: "SYSTEM_INTEGRATION_ERROR",
      failedSystem: failedSystemName,
      requestId: requestId,
      timestamp: expect.any(String),
    });

    expect(mockNotificationService.sendAdminHandoffNotification).toHaveBeenCalledWith(
      {
        requestId: requestId,
        escalationCode: escalationErrorCode,
        failedSystemName: failedSystemName,
        errorMessage: expect.stringContaining("HTTP 503"),
        timestamp: expect.any(String),
      }
    );

    expect(mockNotificationService.sendUnsubmittedReminder).not.toHaveBeenCalled();

    expect(mockNotificationService.createMorningDashboard).not.toHaveBeenCalled();

    expect(mockAiClient.action02ExtractAndClassifyIssues).not.toHaveBeenCalled();
    expect(mockAiClient.action03EvaluateRereleaseRisk).not.toHaveBeenCalled();
    expect(mockAiClient.action04AutoPrioritizeIssues).not.toHaveBeenCalled();
    expect(mockAiClient.action05GenerateRecommendedActions).not.toHaveBeenCalled();
    expect(mockAiClient.action06CreateMorningMeetingDashboard).not.toHaveBeenCalled();
    expect(mockAiClient.action07ExtractAndNotifyUnsubmittedMembers).not.toHaveBeenCalled();

    expect(mockAuditLogger.logTransactionStateChange).toHaveBeenCalledWith({
      requestId: requestId,
      fromState: "in_progress",
      toState: "review_awaiting",
      reason: "system_integration_error_escalation",
      timestamp: expect.any(String),
    });
  });
});