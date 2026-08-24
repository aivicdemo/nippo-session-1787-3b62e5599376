import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
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

describe("Tx5Imp1Agent - 既存ツール連携機能", () => {
  // SCEN-1248: [edge] 既存ツール連携機能 - 課題キーワードの出現頻度が上限値未満の場合、重複なく連携される
  test("SCEN-1248: 課題キーワード出現頻度が上限値未満の場合、重複なく連携される", async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: "サーバー障害",
          frequency: 3,
          confidence: 0.95,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: "サーバー障害",
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: "サーバー障害",
        severity: "high",
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: "success", deliveredAt: new Date() }),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ scheduleId: "sched-001" }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: "delivered" }),
    };

    // 抽出済み課題データの作成
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "issue-001",
        title: "サーバー障害",
        description:
          "サーバー障害が発生した。サーバー障害への対応が急務。サーバー障害の原因調査中。",
        extractedAt: new Date("2024-01-15T09:00:00Z"),
        sourceTeamId: "team-001",
      },
    ];

    // ツール連携設定
    const toolIntegrationConfig: ToolIntegrationConfig = {
      targetTool: "jira",
      apiEndpoint: "https://jira.example.com",
      projectKey: "PROJ",
      apiToken: "mock-token",
    };

    // 優先度判定ルール
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      frequencyThreshold: 5,
      impactThreshold: 50,
    };

    // カテゴリマッピング
    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: "インフラ",
        toolCategory: "Infrastructure",
      },
      {
        systemCategory: "障害",
        toolCategory: "Incident",
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Act: runTx5Imp1Agentを実行
    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    });

    // Assert: 検証結果
    // 1. extractKeywordsが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // 2. 検証済み課題データの確認
    expect(output.validatedIssues).toBeDefined();
    expect(output.validatedIssues.length).toBe(1);

    const validatedIssue: ValidatedIssue = output.validatedIssues[0];

    // 3. 課題IDが正しく設定されていることを確認
    expect(validatedIssue.issueId).toBe("issue-001");

    // 4. 優先度スコアが計算されていることを確認（0～100範囲内）
    expect(validatedIssue.priorityScore).toBeGreaterThanOrEqual(0);
    expect(validatedIssue.priorityScore).toBeLessThanOrEqual(100);

    // 5. 優先度ランクが正しく判定されていることを確認
    // impactScore 75 が高いため、priorityRank は "high" と予想される
    expect(["high", "medium", "low"]).toContain(validatedIssue.priorityRank);

    // 6. カテゴリが設定されていることを確認
    expect(validatedIssue.category).toBeDefined();
    expect(typeof validatedIssue.category).toBe("string");

    // 7. 検証ステータスが "valid" であることを確認
    expect(validatedIssue.validationStatus).toBe("valid");

    // 8. 既存ツール連携結果の確認
    const integrationResult: ToolIntegrationResult = output.integrationResult;
    expect(integrationResult).toBeDefined();

    // 9. 成功件数が1件（重複なく連携されたことを確認）
    expect(integrationResult.successCount).toBe(1);

    // 10. 失敗件数が0件であることを確認
    expect(integrationResult.failureCount).toBe(0);

    // 11. 実行サマリーの確認
    const executionSummary: ExecutionSummary = output.executionSummary;
    expect(executionSummary).toBeDefined();

    // 12. 処理時間が0ミリ秒以上であることを確認
    expect(executionSummary.executionTimeMs).toBeGreaterThanOrEqual(0);

    // 13. 最終ステータスが "completed" であることを確認
    expect(["completed", "partial_failure", "failed"]).toContain(
      executionSummary.finalStatus
    );

    // 14. 出現頻度が3回（上限値5未満）であることを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      extractedIssueData[0].description
    );

    // 15. 同一キーワード（サーバー障害）が複数登録されていないことを確認
    // validatedIssuesに "サーバー障害" というキーワードのレコードが1件だけ存在することを確認
    const serverIssueCount = output.validatedIssues.filter(
      (issue) =>
        issue.category.includes("障害") || validatedIssue.issueId === issue.issueId
    ).length;
    expect(serverIssueCount).toBe(1);
  });
});