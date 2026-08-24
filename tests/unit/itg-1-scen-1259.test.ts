import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1 agent: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  // SCEN-1259: [normal] 既存ツール連携API失敗時の自動リトライ機能 - データ形式エラーで初回リトライが1回目として正常に実行される
  test("should record initial failure as retry attempt 1 and schedule next retry at +5 minutes when integration API returns malformed response", async () => {
    const now = new Date("2024-01-15T09:00:00Z");
    const retryScheduledTime = new Date(now.getTime() + 5 * 60 * 1000); // +5 minutes

    // Mock AI client for tx-5-imp-1 orchestrator
    const mockAiClient = {
      validateAndClassify: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: "issue-001",
            priorityScore: 85,
            priorityRank: "high" as const,
            category: "quality",
            toolIssueId: null,
            validationStatus: "valid" as const,
          },
        ],
        classificationMetadata: {
          totalProcessed: 1,
          validCount: 1,
          warningCount: 0,
          invalidCount: 0,
        },
      }),
      prepareToolIntegration: jest.fn().mockResolvedValue({
        toolType: "jira",
        readyIssues: [
          {
            issueId: "issue-001",
            externalSystemId: "jira",
            mappedCategory: "quality",
            priority: "High",
          },
        ],
      }),
    };

    // Mock NotificationServiceAdapter for retry tracking
    const mockNotificationAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockRejectedValueOnce(
          new Error(
            "Data format error: unexpected response structure from external tool"
          )
        ) // 1st attempt fails with format error
        .mockResolvedValueOnce({
          deliveryStatus: "success",
          messageId: "msg-retry-1",
          sentAt: retryScheduledTime.toISOString(),
        }), // 2nd attempt (after 5 min) succeeds
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: "sched-retry-001",
        scheduledTime: retryScheduledTime.toISOString(),
        retryAttempt: 1,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        messageId: "msg-001",
        status: "pending_retry",
        retryCount: 1,
        nextRetryTime: retryScheduledTime.toISOString(),
      }),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: "issue-001",
          title: "Database performance degradation",
          description: "Query response time exceeds SLA threshold",
          severity: "high" as const,
          affectedUsers: 50,
          discoveredAt: now.toISOString(),
        },
      ],
      toolIntegrationConfig: {
        toolType: "jira" as const,
        apiEndpoint: "https://api.example.com/jira",
        apiKey: "test-key-hidden",
        projectKey: "DEV",
        retryConfig: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelayMs: 5000,
        },
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        thresholds: {
          highPriority: 75,
          mediumPriority: 50,
          lowPriority: 0,
        },
      },
      categoryMappings: [
        {
          systemCategory: "quality",
          toolCategory: "Quality",
          toolId: "cat-quality",
        },
      ],
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    // Verify initial notification send was attempted
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();

    // Verify retry scheduling was executed
    expect(mockNotificationAdapter.scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAttempt: 1,
        nextRetryTime: retryScheduledTime.toISOString(),
      })
    );

    // Verify delivery status shows pending_retry with correct retry count
    const deliveryStatus = await mockNotificationAdapter.getDeliveryStatus();
    expect(deliveryStatus.status).toBe("pending_retry");
    expect(deliveryStatus.retryCount).toBe(1);
    expect(deliveryStatus.nextRetryTime).toBe(
      retryScheduledTime.toISOString()
    );

    // Verify integration result captures the retry attempt
    expect(result.integrationResult).toEqual(
      expect.objectContaining({
        status: "pending_retry",
        failedCount: expect.any(Number),
        retryInfo: expect.objectContaining({
          attempt: 1,
          maxAttempts: 3,
          nextRetryScheduledAt: retryScheduledTime.toISOString(),
          backoffDelayMs: 5000,
        }),
      })
    );

    // Verify execution summary logs the retry attempt
    expect(result.executionSummary).toEqual(
      expect.objectContaining({
        status: "partial_failure",
        totalIssuesProcessed: 1,
        retryScheduled: true,
        failureReason: "Data format error",
        lastRetryAttemptTime: expect.any(String),
      })
    );
  });
});