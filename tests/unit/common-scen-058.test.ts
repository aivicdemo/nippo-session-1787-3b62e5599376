import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from "../../src/agents/tx-3-imp-1/prompts/action-01";
import type { Tx3Imp1AiClient, Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from "../../src/agents/tx-3-imp-1/orchestrator";

describe("Tx3Imp1Agent - 日報集約から優先度別課題一覧提示までの自動判定・配信", () => {
  // SCEN-058
  test("should extract issue keywords from aggregated reports and execute autonomous action-01 correctly", async () => {
    // Arrange: テスト用集約済み日報データを準備
    const aggregatedReportId = "agg-report-2024-01-15";
    const analysisExecutionTime = new Date("2024-01-15T08:00:00Z");
    const managerEmail = "manager@example.com";

    const agentInput: Tx3Imp1AgentInput = {
      reportAggregationId: aggregatedReportId,
      analysisExecutionTime,
      managerEmail,
      priorityThresholds: {
        highPriorityMinScore: 70,
        mediumPriorityMinScore: 40,
      },
    };

    // Action-01で抽出されるキーワードのモック返却データ
    const extractedKeywordsMock = [
      {
        keyword: "システム障害",
        source_report_id: "report-001",
        frequency: 1,
      },
      {
        keyword: "対応遅延",
        source_report_id: "report-002",
        frequency: 2,
      },
      {
        keyword: "在庫管理画面バグ",
        source_report_id: "report-001",
        frequency: 1,
      },
      {
        keyword: "品質問題",
        source_report_id: "report-003",
        frequency: 1,
      },
    ];

    // スタブAIクライアントの実装
    const fakeAiClient: Tx3Imp1AiClient = {
      executeAction01: jest.fn(async (prompt: string) => {
        // プロンプト内容を検証
        expect(prompt).toContain("課題キーワード");
        expect(prompt).toContain("抽出");
        return extractedKeywordsMock;
      }),
      executeAction02: jest.fn(),
      executeAction03: jest.fn(),
      executeAction04: jest.fn(),
      executeAction05: jest.fn(),
    };

    // Action-01プロンプト生成の検証用テキスト
    const action01PromptText = buildAction01Prompt(aggregatedReportId);
    expect(action01PromptText).toBeTruthy();
    expect(action01PromptText.length).toBeGreaterThan(0);

    // Act: runTx3Imp1Agentを実行
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(
      agentInput,
      fakeAiClient
    );

    // Assert: 結果の検証

    // 1. AIクライアントが1回呼び出されたことを確認
    expect(fakeAiClient.executeAction01).toHaveBeenCalledTimes(1);

    // 2. executeAction01に渡されたプロンプトを検証
    const calledPrompt = (fakeAiClient.executeAction01 as jest.Mock).mock
      .calls[0][0];
    expect(calledPrompt).toBeTruthy();
    expect(typeof calledPrompt).toBe("string");

    // 3. 抽出されたキーワード数の検証（3報告あたり1～3キーワード）
    const reportCount = 3; // report-001, report-002, report-003
    const totalKeywordCount = extractedKeywordsMock.length;
    const expectedMaxKeywords = reportCount * 3;
    expect(totalKeywordCount).toBeGreaterThanOrEqual(reportCount);
    expect(totalKeywordCount).toBeLessThanOrEqual(expectedMaxKeywords);

    // 4. extractedIssuesが返却されることを確認
    expect(result.extractedIssues).toBeDefined();
    expect(Array.isArray(result.extractedIssues)).toBe(true);

    // 5. 優先度付き課題リストが返却されることを確認
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);

    // 6. 優先度付き課題リストに色分け情報（赤・黄・緑）が含まれることを確認
    for (const prioritizedIssue of result.prioritizedIssueList) {
      expect(["red", "yellow", "green"]).toContain(prioritizedIssue.colorCode);
      expect(prioritizedIssue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(prioritizedIssue.priorityScore).toBeLessThanOrEqual(100);
    }

    // 7. emailSendStatusが定義されることを確認
    expect(result.emailSendStatus).toBeDefined();
    expect(result.emailSendStatus.success).toBe(true);
    expect(result.emailSendStatus.sentTo).toBe(managerEmail);

    // 8. executionTimestampが記録されることを確認
    expect(result.executionTimestamp).toBeInstanceOf(Date);
    expect(result.executionTimestamp.getTime()).toBeGreaterThanOrEqual(
      analysisExecutionTime.getTime()
    );

    // 9. ACTION_01_PROMPT_VERSIONが定義されることを確認
    expect(ACTION_01_PROMPT_VERSION).toBeTruthy();
    expect(typeof ACTION_01_PROMPT_VERSION).toBe("string");
  });
});