import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx7Imp1Agent } from "../../src/agents/tx-7-imp-1/orchestrator";

// Notification Service Adapter stub interface
interface NotificationServiceAdapterStub {
  sendReminderNotification: jest.Mock<Promise<{ success: boolean; sentAt: Date }>>;
  scheduleNotification: jest.Mock;
  getDeliveryStatus: jest.Mock;
}

// Notification delivery log type
interface NotificationDeliveryLog {
  notificationId: string;
  recipientType: string;
  notificationStatus: "success" | "failure" | "pending";
  notificationType: string;
  messageContent: string;
  sentAt: Date;
  retryAttempt: number;
  retryScheduledFor?: Date;
}

// Mock AI client stub
interface Tx7Imp1AiClientStub {
  analyzeBottleneckTrend: jest.Mock;
  extractTopChallenges: jest.Mock;
  calculateTeamMetrics: jest.Mock;
}

// SCEN-1839: [normal] 月次課題傾向分析レポート生成機能 - 3回の再試行すべてが失敗した場合、部長へエスカレーション通知が送信される
describe("Tx7Imp1Agent - Month Analysis Report Generation with Retry and Escalation", () => {
  test("SCEN-1839: should send escalation notification to manager after 3 failed retry attempts", async () => {
    // Initialize stubs
    const deliveryLogs: NotificationDeliveryLog[] = [];
    let sendReminderCallCount = 0;

    const notificationAdapterStub: NotificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async ({ recipientId, message, notificationType }) => {
        sendReminderCallCount++;
        const sentAt = new Date("2024-01-15T09:00:00Z");
        const retryAttempt = sendReminderCallCount - 1;

        // Record all calls (initial + retries)
        deliveryLogs.push({
          notificationId: `notif-${sendReminderCallCount}`,
          recipientType: recipientId === "manager-001" ? "manager" : "unknown",
          notificationStatus: "failure",
          notificationType: notificationType || "standard",
          messageContent: message || "",
          sentAt: sentAt,
          retryAttempt: retryAttempt,
          retryScheduledFor: undefined,
        });

        // Simulate failure response for all attempts
        return { success: false, sentAt };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const aiClientStub: Tx7Imp1AiClientStub = {
      analyzeBottleneckTrend: jest.fn(async () => ({
        timeSeriesData: [
          {
            date: "2024-01-01",
            bottleneckSeverity: 65,
            affectedTeams: ["backend", "frontend"],
          },
        ],
        improvementTrend: "stable" as const,
        recurringIssuePattern: ["database_performance", "api_latency"],
      })),
      extractTopChallenges: jest.fn(async () => [
        {
          challengeId: "ch-001",
          priorityScore: 85,
          occurrenceFrequency: 12,
          impactLevel: "high",
          resolutionDaysAverage: 3.5,
        },
      ]),
      calculateTeamMetrics: jest.fn(async () => ({
        teamId: "team-dev-001",
        challengeResolutionSpeed: 3.2,
        reportSubmissionRate: 0.92,
        challengeRecurrenceRate: 0.18,
      })),
    };

    // Execute the agent
    const input = {
      triggerTimestamp: new Date("2024-01-15T09:00:00Z"),
      targetMonth: "2024-01",
      managerUserId: "manager-001",
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(input, aiClientStub as any);

    // Verify 3 failed attempts + 1 escalation notification
    expect(notificationAdapterStub.sendReminderNotification).toHaveBeenCalled();
    
    // Verify escalation notification was sent after retries failed
    const escalationLogs = deliveryLogs.filter((log) => log.notificationType === "admin_alert");
    expect(escalationLogs.length).toBeGreaterThan(0);

    // Verify escalation notification content
    const escalationLog = escalationLogs[0];
    expect(escalationLog.recipientType).toBe("manager");
    expect(escalationLog.notificationStatus).toBe("success");
    expect(escalationLog.notificationType).toBe("admin_alert");
    expect(escalationLog.messageContent).toContain("月次課題傾向分析レポート生成に失敗しました");
    expect(escalationLog.messageContent).toContain("再試行を3回試みましたがすべて失敗しました");

    // Verify delivery log timeline
    expect(deliveryLogs.length).toBeGreaterThanOrEqual(3);
    
    // Verify log entries show failure followed by retry attempts
    const initialFailureLog = deliveryLogs[0];
    expect(initialFailureLog.retryAttempt).toBe(0);
    expect(initialFailureLog.notificationStatus).toBe("failure");

    const firstRetryLog = deliveryLogs.find((log) => log.retryAttempt === 1);
    expect(firstRetryLog).toBeDefined();
    expect(firstRetryLog!.notificationStatus).toBe("failure");
    expect(firstRetryLog!.retryScheduledFor?.getTime()).toBeDefined();

    const secondRetryLog = deliveryLogs.find((log) => log.retryAttempt === 2);
    expect(secondRetryLog).toBeDefined();
    expect(secondRetryLog!.notificationStatus).toBe("failure");

    const thirdRetryLog = deliveryLogs.find((log) => log.retryAttempt === 3);
    expect(thirdRetryLog).toBeDefined();
    expect(thirdRetryLog!.notificationStatus).toBe("failure");

    // Verify result indicates partial success with escalation
    expect(result.executionStatus).toMatch(/partial_failure|failure/);
    expect(result.reportId).toBeDefined();
    expect(result.deliveryTimestamp).toBeDefined();

    // Verify AI client was called
    expect(aiClientStub.extractTopChallenges).toHaveBeenCalled();
    expect(aiClientStub.analyzeBottleneckTrend).toHaveBeenCalled();
    expect(aiClientStub.calculateTeamMetrics).toHaveBeenCalled();
  });
});