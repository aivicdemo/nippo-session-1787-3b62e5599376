import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
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
  let auditLogs: Array<{
    timestamp: string;
    eventType: string;
    issueId: string;
    reason: string;
  }> = [];

  beforeEach(() => {
    auditLogs = [];
  });

  afterEach(() => {
    auditLogs = [];
  });

  // SCEN-100
  test("低信頼度・曖昧・不正形式のAI出力を検出してエスカレーションし既存ツール連携をスキップ", async () => {
    const fakeAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: async (issues: ExtractedIssue[]) => {
        // 低信頼度（0.35 < 閾値 0.5）の優先度判定を返す
        // 複数カテゴリ候補を返す（曖昧さ）
        return {
          validatedIssues: [
            {
              issueId: "ISSUE-001",
              priorityScore: 45,
              priorityRank: "medium" as const,
              category: "quality",
              toolIssueId: null,
              validationStatus: "valid" as const,
              confidenceScore: 0.35, // 閾値 0.5 未満
              categoryOptions: ["quality", "schedule"], // 複数カテゴリ該当 → 曖昧
            },
          ],
          confidence: 0.35,
        };
      },
      validateOutput: async (output: unknown) => {
        // 不正な形式を返す（必須フィールド欠落、型不一致）
        return {
          isValid: false,
          errors: [
            "Missing required field: toolIssueId",
            "Field 'priorityScore' type mismatch: expected number, got string",
          ],
          malformedFields: ["toolIssueId", "priorityScore"],
        };
      },
      integrateWithExistingTools: async (
        _issues: unknown,
        _config: ToolIntegrationConfig
      ) => {
        throw new Error("This should not be called due to escalation");
      },
    };

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "ISSUE-001",
        title: "Database query timeout issue",
        description: "Queries exceed 5s timeout",
        reportedAt: "2024-01-15T10:00:00Z",
        reporterId: "engineer-123",
        severity: "high",
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: "jira",
      baseUrl: "https://jira.example.com",
      apiKey: "test-key-12345",
      projectKey: "TEAM",
    };

    const priorityRules: PriorityRuleSet = {
      highPriorityThreshold: 70,
      mediumPriorityThreshold: 40,
      confidenceThreshold: 0.5,
      impactWeights: {
        performanceImpact: 0.3,
        businessImpact: 0.4,
        recurrenceRate: 0.3,
      },
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: "quality",
        toolCategory: "Bug",
      },
      {
        systemCategory: "schedule",
        toolCategory: "Task",
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // runTx5Imp1Agent実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      fakeAiClient,
      (auditEvent: {
        timestamp: string;
        eventType: string;
        issueId: string;
        reason: string;
      }) => {
        auditLogs.push(auditEvent);
      }
    );

    // ===== 期待結果の検証 =====

    // 1. escalation_flag が true に設定されていることを確認
    expect(result.escalation_flag).toBe(true);

    // 2. status が 'ESCALATED_FOR_HUMAN_REVIEW' に設定されていることを確認
    expect(result.status).toBe("ESCALATED_FOR_HUMAN_REVIEW");

    // 3. escalation_reason フィールドに3つの理由が含まれていることを確認
    expect(result.escalation_reason).toContain("LOW_CONFIDENCE_PRIORITY");
    expect(result.escalation_reason).toContain("AMBIGUOUS_CATEGORY");
    expect(result.escalation_reason).toContain("MALFORMED_OUTPUT");
    expect(result.escalation_reason.length).toBe(3);

    // 4. validator_details フィールドに各検証ステップの詳細ログが記録されていることを確認
    expect(result.validator_details).toBeDefined();
    expect(result.validator_details.length).toBeGreaterThan(0);
    expect(result.validator_details).toContain(
      expect.objectContaining({
        check: expect.stringContaining(
          "confidence"
        ),
      })
    );
    expect(result.validator_details).toContain(
      expect.objectContaining({
        check: expect.stringContaining(
          "category"
        ),
      })
    );
    expect(result.validator_details).toContain(
      expect.objectContaining({
        check: expect.stringContaining(
          "format"
        ),
      })
    );

    // 5. integrationResult に連携処理が実行されていない（スキップされた）ことを確認
    // 連携系メソッドが呼ばれていないため、成功件数は0
    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.status).toBe("SKIPPED_DUE_TO_ESCALATION");

    // 6. validatedIssues が空または escalation フラグ付きで返されていることを確認
    // （既存ツール登録はされず、人の確認待ち状態）
    expect(result.validatedIssues.length).toBeGreaterThanOrEqual(0);
    if (result.validatedIssues.length > 0) {
      result.validatedIssues.forEach((issue) => {
        expect(issue.validationStatus).toBe("invalid");
      });
    }

    // 7. 監査ログに課題IDと検出したすべてのエスカレーション理由が記録されていることを確認
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
    const auditLogReasons = auditLogs.map((log) => log.reason);
    expect(auditLogReasons).toContain("LOW_CONFIDENCE_PRIORITY");
    expect(auditLogReasons).toContain("AMBIGUOUS_CATEGORY");
    expect(auditLogReasons).toContain("MALFORMED_OUTPUT");

    // 課題IDが監査ログに記録されていることを確認
    const auditLogIssueIds = auditLogs.map((log) => log.issueId);
    expect(auditLogIssueIds).toContain("ISSUE-001");

    // 8. executionSummary に実行結果の全体サマリーが含まれていることを確認
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.status).toBe("ESCALATED");
    expect(result.executionSummary.totalIssuesProcessed).toBe(1);
    expect(result.executionSummary.escalatedIssuesCount).toBe(1);
    expect(result.executionSummary.exceptionOccurred).toBe(false); // 正常に完了（例外なし）
  });
});