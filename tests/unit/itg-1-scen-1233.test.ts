import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行", () => {
  // SCEN-1233: [error] 既存ツール連携機能 - NotificationServiceAdapter 経由の外部通知サービスが失敗したとき内部キューに一時保存される
  it("should save failed notification to internal queue when external service fails", async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValueOnce(
        new Error("Network timeout")
      ),
      scheduleNotification: jest.fn().mockResolvedValueOnce({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValueOnce({
        status: "failed",
        userId: "engineer-001",
        timestamp: "2024-01-15T08:30:00Z",
        error: "Network timeout",
      }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValueOnce([
        { keyword: "database_performance", frequency: 3 },
        { keyword: "api_latency", frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValueOnce(75),
      classifyIssueSeverity: jest.fn().mockResolvedValueOnce("high"),
    };

    const mockToolIntegrationConfig = {
      toolType: "jira" as const,
      apiEndpoint: "https://jira.example.com/rest/api/3",
      authToken: "mock-token",
      projectKey: "PROJ",
    };

    const mockInput: Tx5Imp1AgentInput = {
      extractedIssueData: [
        {
          issueId: "issue-001",
          title: "Database performance degradation",
          description: "Queries taking 5+ seconds",
          category: "Performance",
          priority: "high",
        },
      ],
      toolIntegrationConfig: mockToolIntegrationConfig,
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        thresholds: {
          highStart: 75,
          mediumStart: 50,
          lowStart: 0,
        },
      },
      categoryMappings: [
        {
          sourceCategory: "Performance",
          targetCategory: "Performance Issues",
          toolSpecificField: "component",
        },
      ],
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      mockInput,
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.failureCount).toBeGreaterThan(0);
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.status).toBe("partial_failure");

    const internalQueue = result.integrationResult.retryQueue || [];
    expect(internalQueue).toContainEqual(
      expect.objectContaining({
        userId: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
        retryCount: 0,
        nextRetryTime: expect.any(String),
      })
    );

    const failureRecord = internalQueue.find(
      (item: any) => item.retryCount === 0
    );
    expect(failureRecord).toBeDefined();
    expect(failureRecord.retryCount).toBe(0);
    expect(new Date(failureRecord.nextRetryTime).getTime()).toBeGreaterThan(
      new Date(failureRecord.timestamp).getTime()
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});