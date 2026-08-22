import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import { type Tx5Imp1AiClient } from "../../src/agents/tx-5-imp-1/orchestrator";
import { type ExtractedIssue } from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1 orchestrator - escalation on low confidence", () => {
  test("SCEN-096: escalates to human when priority confidence score is below threshold", async () => {
    // Arrange: 抽出済み課題データを準備（形式・内容ともに有効）
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "issue-001",
        title: "Database connection timeout",
        description: "Service fails to connect to database during peak hours",
        severity: "high",
        affectedSystem: "payment-api",
        reportedAt: new Date("2024-01-15T09:30:00Z"),
      },
      {
        issueId: "issue-002",
        title: "Memory leak in batch processor",
        description: "Memory usage increases continuously during batch job execution",
        severity: "medium",
        affectedSystem: "batch-service",
        reportedAt: new Date("2024-01-15T10:15:00Z"),
      },
    ];

    // ツール連携設定（正常）
    const toolIntegrationConfig = {
      toolType: "jira" as const,
      baseUrl: "https://jira.example.com",
      apiToken: "test-token",
      projectKey: "ENG",
    };

    // 優先度ルール
    const priorityRules = {
      impactWeight: 0.5,
      frequencyWeight: 0.3,
      businessImpactWeight: 0.2,
      highPriorityThreshold: 0.7,
      mediumPriorityThreshold: 0.4,
    };

    // カテゴリマッピング
    const categoryMappings = [
      {
        extractedCategory: "infra",
        toolCategory: "Infrastructure",
      },
      {
        extractedCategory: "performance",
        toolCategory: "Performance",
      },
    ];

    // Fake AI Client: 信頼度スコア 0.45（閾値 0.5 以下）を返却
    const fakeAiClient: Tx5Imp1AiClient = {
      action01ValidateFormat: jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
      }),
      action02JudgePriority: jest.fn().mockResolvedValue({
        confidenceScore: 0.45, // 閾値 0.5 以下
        priorityRank: "medium",
        category: "infrastructure",
        reasoning:
          "Database timeout is critical but infrequent; confidence is moderate",
      }),
      action03ConfigToolIntegration: jest.fn(),
      action04RegisterToJiraAsana: jest.fn(),
      action05RecordStatus: jest.fn(),
    };

    // Act: orchestrator を実行
    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      fakeAiClient
    );

    // Assert: escalation が正しく実行されたことを確認
    expect(result.status).toBe("escalated");
    expect(result.escalationReason).toBe("優先度判定の信頼度が閾値以下");
    expect(result.confidenceScore).toBe(0.45);
    expect(result.threshold).toBe(0.5);

    // 副作用が実行されていないことを確認
    expect(result.sideEffectsExecuted).toBe(false);
    expect(fakeAiClient.action03ConfigToolIntegration).not.toHaveBeenCalled();
    expect(fakeAiClient.action04RegisterToJiraAsana).not.toHaveBeenCalled();

    // 抽出課題データが保持されていることを確認
    expect(result.extractedIssueData).toEqual(extractedIssueData);

    // 人への通知対象フィールドが設定済みであることを確認
    expect(result.assigneeForReview).toBe("human_reviewer");
    expect(result.notificationChannel).toBeDefined();

    // Action 1 は実行されていることを確認（形式検証）
    expect(fakeAiClient.action01ValidateFormat).toHaveBeenCalledWith(
      extractedIssueData
    );

    // Action 2 は実行されていることを確認（優先度判定）
    expect(fakeAiClient.action02JudgePriority).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssues: extractedIssueData,
        priorityRules,
      })
    );

    // ログイベントが記録されていることを確認
    expect(result.auditEvents).toBeDefined();
    expect(result.auditEvents.length).toBeGreaterThan(0);
    const escalationEvent = result.auditEvents.find(
      (event) => event.type === "escalation_initiated"
    );
    expect(escalationEvent).toBeDefined();
    if (escalationEvent) {
      expect(escalationEvent.metadata.reason).toBe(
        "優先度判定の信頼度が閾値以下"
      );
      expect(escalationEvent.metadata.confidenceScore).toBe(0.45);
      expect(escalationEvent.metadata.threshold).toBe(0.5);
      expect(escalationEvent.metadata.sideEffectsExecuted).toBe(false);
    }
  });
});