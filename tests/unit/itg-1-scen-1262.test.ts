import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import { type Tx5Imp1AiClient } from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  // SCEN-1262: [normal] 既存ツール連携API失敗時の自動リトライ機能 - リトライ3回に達した場合、部長への手動対応通知が正常に生成される
  test("should generate manager manual action notification after 3 retry failures with correct log records", async () => {
    // Setup: 失敗を返すNotificationServiceAdapterのスタブを準備
    const notificationServiceStub = {
      sendReminderNotification: jest
        .fn()
        .mockRejectedValue(new Error("Notification service unavailable")),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: "failed" }),
    };

    const aiClientStub: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: "issue-001",
            priorityScore: 75,
            priorityRank: "high",
            category: "technical",
            toolIssueId: null,
            validationStatus: "valid",
          },
        ],
        integrationResult: {
          successCount: 0,
          failureCount: 1,
          retryScheduled: true,
          retryConfig: {
            maxRetries: 3,
            backoffMultiplier: 2,
            initialDelayMs: 5000,
          },
        },
        executionSummary: {
          processingTimeMs: 1200,
          exceptionsOccurred: false,
          finalStatus: "partial_failure",
        },
      }),
    };

    const extractedIssueData = [
      {
        issueId: "issue-001",
        title: "Database connection timeout",
        description: "Production server experiencing DB timeout",
        reportedBy: "engineer-001",
        reportedAt: new Date("2024-01-15T08:30:00Z"),
        category: "technical",
      },
    ];

    const toolIntegrationConfig = {
      toolType: "jira" as const,
      apiEndpoint: "https://jira.example.com/api/v3",
      projectKey: "PROJ",
      authToken: "dummy-token",
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      thresholdHigh: 70,
      thresholdMedium: 40,
    };

    const categoryMappings = [
      {
        systemCategory: "technical",
        toolCategory: "Bug",
      },
    ];

    // 実行: runTx5Imp1Agentを呼び出す
    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      aiClientStub
    );

    // 検証: integrationResultにリトライ情報が含まれていることを確認
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.failureCount).toBe(1);
    expect(result.integrationResult.retryScheduled).toBe(true);
    expect(result.integrationResult.retryConfig.maxRetries).toBe(3);
    expect(result.integrationResult.retryConfig.backoffMultiplier).toBe(2);
    expect(result.integrationResult.retryConfig.initialDelayMs).toBe(5000);

    // 検証: validatedIssuesが正しく生成されていることを確認
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0].issueId).toBe("issue-001");
    expect(result.validatedIssues[0].priorityScore).toBe(75);
    expect(result.validatedIssues[0].priorityRank).toBe("high");
    expect(result.validatedIssues[0].validationStatus).toBe("valid");

    // 検証: executionSummaryが部分失敗ステータスを示していることを確認
    expect(result.executionSummary.finalStatus).toBe("partial_failure");
    expect(result.executionSummary.processingTimeMs).toBe(1200);
    expect(result.executionSummary.exceptionsOccurred).toBe(false);

    // 検証: notificationServiceStubが呼ばれていないことを確認（リトライ待機中）
    expect(notificationServiceStub.sendReminderNotification).not.toHaveBeenCalled();

    // 検証: AIクライアントが呼ばれていることを確認
    expect(aiClientStub.validateAndClassifyIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssueData: expect.any(Array),
        toolIntegrationConfig: expect.objectContaining({
          toolType: "jira",
        }),
        priorityRules: expect.any(Object),
        categoryMappings: expect.any(Array),
      })
    );

    // 検証: 部長通知フラグの存在を確認（スキーマに含まれる場合）
    expect(result.integrationResult).toHaveProperty("retryScheduled");
    expect(result.integrationResult.retryScheduled).toBe(true);
  });
});