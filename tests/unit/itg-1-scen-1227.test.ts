import { describe, test, expect, beforeEach } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  test("SCEN-1227: 既存ツール連携機能 - 送信対象の課題が既存ツールに既に登録されているが課題キーが一致しないとき重複登録が検出される", async () => {
    // ========================================
    // 1. テスト対象システムの初期設定
    // ========================================

    // 既存ツール（外部システム）に登録済みの課題情報
    const existingToolIssue = {
      externalKey: "EXT-5001",
      title: "APIエラー対応",
      description: "API レスポンスエラーの対応",
    };

    // 朝会報告管理システムで新規抽出される課題
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "SCEN-1227",
        title: "APIエラー対応",
        description: "新規報告：APIエラー対応が必要",
        frequency: 3,
        impactScore: 75,
      },
    ];

    // ========================================
    // 2. ツール連携設定
    // ========================================

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: "jira",
      apiEndpoint: "https://jira.example.com/api",
      apiKey: "fake-api-key-for-testing",
    };

    // 優先度判定ルール
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    // カテゴリマッピング
    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: "技術課題",
        externalToolCategory: "TECHNICAL",
      },
      {
        systemCategory: "品質課題",
        externalToolCategory: "QUALITY",
      },
    ];

    // ========================================
    // 3. TextAnalysisServiceAdapter のスタブ化
    // ========================================

    const stubTextAnalysisService = {
      extractKeywords: jest.fn(async () => ({
        keywords: ["APIエラー対応"],
        frequency: 3,
        confidence: 0.85,
      })),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 75,
        reasoning: "複数メンバーに影響",
      })),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: "high" as const,
      })),
    };

    // ========================================
    // 4. ツール連携機能（外部ツール検索）のスタブ化
    // ========================================

    const stubToolIntegrationAdapter = {
      searchExistingIssue: jest.fn(async (title: string) => {
        // 既存ツール内で同一課題名を検索
        if (title === "APIエラー対応") {
          return {
            found: true,
            externalKey: "EXT-5001",
            title: "APIエラー対応",
            existingDescription: "API レスポンスエラーの対応",
          };
        }
        return { found: false };
      }),
      createIssue: jest.fn(async () => {
        throw new Error(
          "課題『APIエラー対応』は既存キー『EXT-5001』として既に登録されています。キーの不一致が検出されました（既存: EXT-5001、新規: SCEN-1227）"
        );
      }),
    };

    // ========================================
    // 5. NotificationServiceAdapter のスタブ化
    // ========================================

    const stubNotificationService = {
      sendDuplicateWarning: jest.fn(async () => ({
        status: "sent",
        message: "重複登録警告を配信しました",
      })),
    };

    // ========================================
    // 6. エージェント入力を構築
    // ========================================

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // ========================================
    // 7. スタブを組み込んだ AI クライアント インターフェース
    // ========================================

    const fakeAiClient = {
      textAnalysisService: stubTextAnalysisService,
      toolIntegrationAdapter: stubToolIntegrationAdapter,
      notificationService: stubNotificationService,
    };

    // ========================================
    // 8. エージェント実行
    // ========================================

    let agentOutput: Tx5Imp1AgentOutput | undefined;
    let thrownError: Error | undefined;

    try {
      agentOutput = await runTx5Imp1Agent(agentInput, fakeAiClient as any);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    // ========================================
    // 9. 期待結果の検証
    // ========================================

    // 既存ツール検索が呼び出されたことを確認
    expect(stubToolIntegrationAdapter.searchExistingIssue).toHaveBeenCalledWith(
      "APIエラー対応"
    );

    // 重複登録検出のため、課題作成が失敗し、エラーが発生すること
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toMatch(/既存キー『EXT-5001』/);
    expect(thrownError?.message).toMatch(/新規: SCEN-1227/);

    // 重複登録警告がユーザーに通知されたことを確認
    expect(
      stubNotificationService.sendDuplicateWarning
    ).toHaveBeenCalled();

    // agentOutput が未定義（処理が中止）であることを確認
    expect(agentOutput).toBeUndefined();

    // テキスト解析サービスは呼び出され、キーワード抽出に成功していることを確認
    expect(stubTextAnalysisService.extractKeywords).toHaveBeenCalled();
    expect(stubTextAnalysisService.assessImpactScore).toHaveBeenCalled();
  });
});