import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from "../../src/agents/tx-5-imp-1/prompts/action-01";
import { type Tx5Imp1AiClient, type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from "../../src/agents/tx-5-imp-1/orchestrator";

describe("Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行", () => {
  // SCEN-091
  test("Action 1: 抽出課題データの形式・内容を検証する - 検証成功時に「valid: true」と検証完了タイムスタンプが記録される", async () => {
    const extractedIssueData = [
      {
        issueId: "issue-001",
        title: "データベース接続エラー発生",
        description: "本番環境のデータベース接続がタイムアウトし、APIレスポンスが遅延している。影響範囲は顧客向けポータル全体。",
        source: "daily_report" as const,
        extractedAt: "2024-01-15T09:30:00Z",
        severity_hint: "high" as const,
        category_hint: ["infrastructure", "database"],
      },
    ];

    const toolIntegrationConfig = {
      toolType: "jira" as const,
      baseUrl: "https://jira.example.com",
      apiKey: "test-api-key",
      projectKey: "PROJ",
    };

    const priorityRules = {
      frequency_weight: 0.3,
      impact_weight: 0.5,
      urgency_weight: 0.2,
      high_threshold: 75,
      medium_threshold: 50,
    };

    const categoryMappings = [
      {
        system_category: "infrastructure",
        tool_category: "Infrastructure",
      },
      {
        system_category: "database",
        tool_category: "Database",
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    let action01_called = false;
    let action01_prompt_version_recorded: string | null = null;
    let validation_result_recorded: {
      valid: boolean;
      errors: string[];
      warnings: string[];
      completedAt?: string;
    } | null = null;

    const mockAiClient: Tx5Imp1AiClient = {
      async callAction01ValidationPrompt(
        userMessage: string,
        systemPrompt: string
      ): Promise<string> {
        action01_called = true;
        action01_prompt_version_recorded = ACTION_01_PROMPT_VERSION;
        const validationResult = {
          valid: true,
          errors: [],
          warnings: [],
          completedAt: "2024-01-15T09:35:00Z",
          fields_validated: [
            "id",
            "title",
            "description",
            "source",
            "extractedAt",
            "severity_hint",
            "category_hint",
          ],
        };
        validation_result_recorded = validationResult;
        return JSON.stringify(validationResult);
      },
      async callAction02CategorizePrompt(userMessage: string, systemPrompt: string): Promise<string> {
        return JSON.stringify({ category: "infrastructure" });
      },
      async callAction03PrioritizePrompt(userMessage: string, systemPrompt: string): Promise<string> {
        return JSON.stringify({ priorityScore: 85, priorityRank: "high" });
      },
      async callAction04IntegratePrompt(userMessage: string, systemPrompt: string): Promise<string> {
        return JSON.stringify({ toolIssueId: "PROJ-001", integrated: true });
      },
      async callAction05NotifyPrompt(userMessage: string, systemPrompt: string): Promise<string> {
        return JSON.stringify({ notificationSent: true });
      },
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient);

    expect(action01_called).toBe(true);
    expect(action01_prompt_version_recorded).toBe(ACTION_01_PROMPT_VERSION);
    expect(validation_result_recorded).not.toBeNull();
    expect(validation_result_recorded?.valid).toBe(true);
    expect(validation_result_recorded?.errors).toEqual([]);
    expect(validation_result_recorded?.completedAt).toBe("2024-01-15T09:35:00Z");

    expect(result.validatedIssues).toBeDefined();
    expect(result.validatedIssues.length).toBeGreaterThan(0);
    expect(result.validatedIssues[0].validationStatus).toBe("valid");
    expect(result.executionSummary.finalStatus).toBe("success");
  });
});