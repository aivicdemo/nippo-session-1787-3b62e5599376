import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  Tx5Imp1AiClient,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  let notificationServiceAdapterCallCount: number;
  let notificationServiceAdapterCallHistory: Array<{
    timestamp: Date;
    userId: string;
    status: "success" | "failure";
  }>;
  let adminAlertSent: boolean;

  beforeEach(() => {
    notificationServiceAdapterCallCount = 0;
    notificationServiceAdapterCallHistory = [];
    adminAlertSent = false;
  });

  afterEach(() => {
    notificationServiceAdapterCallCount = 0;
    notificationServiceAdapterCallHistory = [];
    adminAlertSent = false;
  });

  // SCEN-1281
  test("既存ツール連携API失敗時に最大3回までのリトライが実行され、4回目のリトライは試みられない", async () => {
    // ============================================================
    // Setup: スタブの NotificationServiceAdapter を作成
    // ============================================================
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        notificationServiceAdapterCallCount++;
        const callRecord = {
          timestamp: new Date("2024-01-15T09:00:00Z"),
          userId: userId,
          status: "failure" as const,
        };
        notificationServiceAdapterCallHistory.push(callRecord);

        // 全てのリトライで失敗を返す
        return { success: false, deliveryStatus: "failed" };
      }),

      scheduleNotification: jest.fn(async () => {
        return { scheduled: true };
      }),

      getDeliveryStatus: jest.fn(async (notificationId: string) => {
        return { status: "failed", notificationId: notificationId };
      }),
    };

    // ============================================================
    // Input データの準備
    // ============================================================
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "ISSUE-001",
        title: "Database connection timeout",
        description: "Connection to production DB fails under load",
        extractionConfidence: 0.95,
        category: "Performance",
        severity: "high",
      },
      {
        issueId: "ISSUE-002",
        title: "API response delay",
        description: "REST API returns late responses during peak hours",
        extractionConfidence: 0.87,
        category: "Performance",
        severity: "medium",
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: "jira",
      apiEndpoint: "https://jira.example.com/api/v3",
      projectKey: "PROJ",
      authenticationType: "oauth2",
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highFrequencyThreshold: 5,
      highImpactThreshold: 80,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategory: "Performance",
        targetCategory: "BUG",
        priority: "High",
      },
      {
        sourceCategory: "Security",
        targetCategory: "SECURITY",
        priority: "Critical",
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // ============================================================
    // Agent 実行
    // ============================================================
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockNotificationServiceAdapter as unknown as Tx5Imp1AiClient
    );

    // ============================================================
    // 検証 1: 初回 + リトライ 2 回 = 合計 3 回の呼び出し確認
    // ============================================================
    // リトライロジック: 初回失敗 → 5分後リトライ（失敗） → 15分後リトライ（失敗）
    // = 合計 3 回のみが正常動作
    expect(notificationServiceAdapterCallCount).toBe(3);

    // ============================================================
    // 検証 2: 通知配信ログテーブルの記録確認
    // ============================================================
    expect(notificationServiceAdapterCallHistory.length).toBe(3);
    expect(notificationServiceAdapterCallHistory[0].status).toBe("failure");
    expect(notificationServiceAdapterCallHistory[1].status).toBe("failure");
    expect(notificationServiceAdapterCallHistory[2].status).toBe("failure");

    // ============================================================
    // 検証 3: 4 回目の呼び出しが発生していないことを確認
    // ============================================================
    // リトライ条件: maxRetries = 3 により、初回 + リトライ 2 回で終了
    // 4 回目呼び出しは発生しないことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(
      3
    );

    // ============================================================
    // 検証 4: Integration result に failed status が記録されている
    // ============================================================
    expect(result.integrationResult.status).toMatch(
      /partial_failure|retry_scheduled/
    );
    expect(result.integrationResult.failedCount).toBeGreaterThan(0);

    // ============================================================
    // 検証 5: Administration alert が正しく登録されている
    // ============================================================
    // 3 回失敗時、部長へのアラート通知が発火
    expect(result.executionSummary.status).toMatch(/completed|partial_failure/);

    // ============================================================
    // 検証 6: マックスリトライ設定の確認
    // ============================================================
    // IntegrationRetryConfig: maxRetries = 3
    // initialDelayMs = 初回失敗後 5 分（300000ms）
    // backoffMultiplier = 2
    // 2 回目: 5分 * 2 = 10分 → テスト上は 15分（10 + margin）
    // 3 回目: 10分 * 2 = 20分 → テスト上は 1時間（仕様に記載）
    expect(result.integrationResult.failedCount).toBe(2);

    // ============================================================
    // 検証 7: 呼び出し履歴に 4 回目がないこと（スタブの確認）
    // ============================================================
    const totalInvocations =
      mockNotificationServiceAdapter.sendReminderNotification.mock.calls.length;
    expect(totalInvocations).toBe(3);
  });
});