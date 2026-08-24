import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  test("SCEN-3154: ツール連携失敗時にスケジュール前に人へ引き継ぎ通知", async () => {
    // Arrange: ツール連携失敗を模擬するfake AI client
    const mockAiClient = {
      callAction01ValidateIssues: jest.fn().mockResolvedValue({
        validation_status: "valid",
        validated_issues: [
          {
            issue_id: "issue-2024-001",
            content: "Database connection timeout on login endpoint",
            confidence: 0.95,
          },
        ],
      }),
      callAction02JudgePriority: jest.fn().mockResolvedValue({
        priority_results: [
          {
            issue_id: "issue-2024-001",
            priority_score: 78,
            priority_rank: "high",
            category: "performance",
            reasoning: "Affects user login, high impact",
          },
        ],
      }),
      callAction03SetupIntegration: jest.fn().mockResolvedValue({
        setup_status: "ready",
        tool_type: "jira",
        mapped_categories: ["performance"],
      }),
      callAction04ExecuteIntegration: jest
        .fn()
        .mockRejectedValue(
          new Error(
            "Integration failed: Authentication failed with Jira API"
          )
        ),
      callAction05RecordStatus: jest.fn().mockResolvedValue({
        recorded_at: "2024-01-15T09:30:45Z",
      }),
    };

    const mockNotificationService = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ sent_at: "2024-01-15T09:30:50Z" }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({}),
    };

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: [
        {
          issue_id: "issue-2024-001",
          content: "Database connection timeout on login endpoint",
          extracted_from_report_id: "report-20240115-001",
          frequency_count: 3,
          impact_assessment: "Affects production login service",
        },
      ],
      toolIntegrationConfig: {
        tool_type: "jira",
        api_endpoint: "https://jira.internal.example.com",
        workspace_id: "workspace-prod",
        auth_token_vault_key: "jira_api_key",
      },
      priorityRules: {
        high_threshold: 70,
        medium_threshold: 40,
        frequency_weight: 0.4,
        impact_weight: 0.6,
      },
      categoryMappings: [
        {
          internal_category: "performance",
          tool_category_id: "PERF",
          tool_category_name: "Performance",
        },
        {
          internal_category: "security",
          tool_category_id: "SEC",
          tool_category_name: "Security",
        },
      ],
    };

    // Act: エージェント実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockAiClient,
      mockNotificationService
    );

    // Assert: ツール連携失敗を検知し、人への引き継ぎが実行されたことを確認

    // 1. 通知サービスが呼び出されたことを確認
    expect(mockNotificationService.sendReminderNotification).toHaveBeenCalled();

    // 2. 通知ペイロードの内容を確認
    const notificationCall =
      mockNotificationService.sendReminderNotification.mock.calls[0];
    expect(notificationCall).toBeDefined();
    const notificationPayload = notificationCall[0];
    expect(notificationPayload.issue_id).toBe("issue-2024-001");
    expect(notificationPayload.priority_score).toBe(78);
    expect(notificationPayload.priority_rank).toBe("high");
    expect(notificationPayload.category).toBe("performance");
    expect(notificationPayload.error_reason).toContain("Authentication failed");
    expect(notificationPayload.recipient_role).toBe("human_reviewer");

    // 3. オーケストレーター戻り値の検証
    expect(result.escalation_type).toBe("tool_integration_error");
    expect(result.status).toBe("awaiting_human_review");
    expect(result.human_review_required).toBe(true);
    expect(result.side_effects_committed).toBe(false);
    expect(result.notification_sent_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.notification_recipient).toBeDefined();

    // 4. ツール側への登録が行われていないことを確認
    // （Action04が失敗したため、Action05は呼び出されていない）
    expect(mockAiClient.callAction05RecordStatus).not.toHaveBeenCalled();

    // 5. バリデーション済み課題データが含まれていることを確認
    expect(result.validated_issues).toHaveLength(1);
    expect(result.validated_issues[0].issue_id).toBe("issue-2024-001");
    expect(result.validated_issues[0].priority_score).toBe(78);
    expect(result.validated_issues[0].priority_rank).toBe("high");
    expect(result.validated_issues[0].category).toBe("performance");
    expect(result.validated_issues[0].validation_status).toBe("valid");
    expect(result.validated_issues[0].tool_issue_id).toBeNull();

    // 6. 統合結果に失敗情報が記録されていることを確認
    expect(result.integration_result.failed_count).toBe(1);
    expect(result.integration_result.success_count).toBe(0);
    expect(result.integration_result.failed_issues).toContain("issue-2024-001");
    expect(result.integration_result.error_details).toContain("Authentication failed");
    expect(result.integration_result.retry_scheduled).toBe(false);

    // 7. 実行サマリーの検証
    expect(result.execution_summary.status).toBe("partial_failure");
    expect(result.execution_summary.total_issues_processed).toBe(1);
    expect(result.execution_summary.issues_passed_validation).toBe(1);
    expect(result.execution_summary.issues_failed_integration).toBe(1);
    expect(result.execution_summary.processing_completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});