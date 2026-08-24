import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  Tx5Imp1AiClient,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  let mockNotificationAdapter: jest.Mocked<any>;
  let mockAiClient: jest.Mocked<Tx5Imp1AiClient>;
  let notificationCallLog: Array<{
    timestamp: Date;
    userId: string;
    message: string;
  }>;
  let retryAttemptLog: Array<{
    attemptNumber: number;
    timestamp: Date;
    status: string;
  }>;

  beforeEach(() => {
    notificationCallLog = [];
    retryAttemptLog = [];

    mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        notificationCallLog.push({
          timestamp: new Date("2024-01-15T12:00:00Z"),
          userId,
          message,
        });
        return {
          success: false,
          deliveryStatus: "failed",
          error: "API_FAILURE",
        };
      }),
    };

    mockAiClient = {
      validateAndClassify: jest.fn(async (issues: ExtractedIssue[]) => {
        return {
          validatedIssues: issues.map((issue, idx) => ({
            issueId: issue.id,
            priorityScore: 85 + idx * 5,
            priorityRank: idx === 0 ? "high" : "medium",
            category: "development",
            toolIssueId: null,
            validationStatus: "valid",
          })),
          classificationMetadata: {
            processedAt: new Date("2024-01-15T11:55:00Z"),
            confidence: 0.92,
          },
        };
      }),
      retryIntegration: jest.fn(async (config: any) => {
        const maxRetries = config.maxRetries || 3;
        const backoffMultiplier = config.backoffMultiplier || 2;
        const initialDelayMs = config.initialDelayMs || 5000;

        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
          retryAttemptLog.push({
            attemptNumber: attempt,
            timestamp: new Date("2024-01-15T12:00:00Z"),
            status: "attempting",
          });

          try {
            const delayMs =
              attempt === 1 ? 0 : initialDelayMs * Math.pow(backoffMultiplier, attempt - 2);
            await new Promise((resolve) => setTimeout(resolve, delayMs));

            throw new Error("Integration API failed");
          } catch (error) {
            if (attempt > maxRetries) {
              retryAttemptLog.push({
                attemptNumber: attempt,
                timestamp: new Date("2024-01-15T12:00:00Z"),
                status: "exhausted",
              });
              throw new Error("Max retries exceeded");
            }
          }
        }
      }),
    };
  });

  // SCEN-1268
  test("should send manual intervention notification to director after 3 retry failures for tool integration", async () => {
    const extractedIssueData: ExtractedIssue[] = [
      {
        id: "issue-001",
        title: "Database connection timeout",
        description: "API Gateway connection to database times out intermittently",
        severity: "high",
        detectedAt: new Date("2024-01-15T11:30:00Z"),
      },
      {
        id: "issue-002",
        title: "Memory leak in worker process",
        description: "Worker process memory usage increases over time",
        severity: "medium",
        detectedAt: new Date("2024-01-15T11:35:00Z"),
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: "jira",
      apiEndpoint: "https://jira.example.com/api",
      apiKey: "test-key",
      projectKey: "DEV",
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 5000,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      thresholds: {
        highPriority: 75,
        mediumPriority: 50,
        lowPriority: 25,
      },
    };

    const categoryMappings: CategoryMapping[] = [
      {
        issueCategory: "performance",
        toolCategory: "Performance",
        priority: "high",
      },
      {
        issueCategory: "stability",
        toolCategory: "Stability",
        priority: "medium",
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    try {
      await runTx5Imp1Agent(input, mockAiClient);
    } catch (error) {
      // Expected to throw after retries exhausted
    }

    // Verify retry attempts were made with correct intervals
    expect(retryAttemptLog.length).toBeGreaterThanOrEqual(4);
    expect(retryAttemptLog[0].attemptNumber).toBe(1);
    expect(retryAttemptLog[1].attemptNumber).toBe(2);
    expect(retryAttemptLog[2].attemptNumber).toBe(3);
    expect(retryAttemptLog[3].attemptNumber).toBe(4);

    // Verify notification was sent to director
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();

    const directorNotificationCall = mockNotificationAdapter.sendReminderNotification.mock.calls.find(
      (call) => call[1]?.includes("課題データ連携が3回失敗しました")
    );
    expect(directorNotificationCall).toBeDefined();

    // Verify notification log entry was recorded
    expect(notificationCallLog.length).toBeGreaterThan(0);
    const manualInterventionLog = notificationCallLog.find(
      (log) => log.message.includes("課題データ連携が3回失敗しました")
    );
    expect(manualInterventionLog).toBeDefined();
    expect(manualInterventionLog?.timestamp).toEqual(new Date("2024-01-15T12:00:00Z"));
  });
});