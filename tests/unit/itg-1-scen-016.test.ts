import { runTx5Imp1Agent, type Tx5Imp1AiClient } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssueData,
  ValidationResult,
  CategorizedIssue,
  ToolIntegrationStatus,
  ExceptionCase,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1: 抽出済み課題データの検証と既存ツール連携", () => {
  // SCEN-016: 正常系 - 抽出済み課題データを自動検証し、優先度・カテゴリを判定して既存ツールへ登録・連携を完結させる
  test("should validate extracted issues and sync to external tool successfully", async () => {
    // Arrange: 正常な入力値を設定
    const extractedIssueData1: ExtractedIssueData = {
      issueId: "issue-001",
      issueContent: "ビルドプロセスが頻繁に失敗している状況が報告されています",
      extractedKeywords: ["ビルド失敗", "エラー"],
      occurrenceFrequency: 5,
      impactScore: 75,
      reportSourceIds: ["report-001", "report-002", "report-003"],
    };

    const extractedIssueData2: ExtractedIssueData = {
      issueId: "issue-002",
      issueContent: "テスト環境のデータベース接続が不安定である",
      extractedKeywords: ["テスト環境", "接続エラー"],
      occurrenceFrequency: 3,
      impactScore: 60,
      reportSourceIds: ["report-002", "report-004"],
    };

    const extractedIssueData3: ExtractedIssueData = {
      issueId: "issue-003",
      issueContent: "リソース不足のためタスク完了期限が延期されている",
      extractedKeywords: ["リソース不足", "遅延"],
      occurrenceFrequency: 2,
      impactScore: 50,
      reportSourceIds: ["report-005"],
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueDataList: [
        extractedIssueData1,
        extractedIssueData2,
        extractedIssueData3,
      ],
      projectManagerId: "pm-user-001",
      externalToolConfig: {
        toolType: "jira",
        apiBaseUrl: "https://jira.example.com/rest/api/3",
        apiToken: "valid-api-token-12345",
        projectKey: "PROJ",
      },
      validationThresholds: {
        minCompletednessScore: 70,
        minAccuracyScore: 65,
        minUtilityScore: 60,
      },
    };

    // Mock dependency: validateReportQuality - すべて合格を返す
    const validateReportQualityStub = jest
      .fn()
      .mockResolvedValue({
        status: "passed",
        completenessScore: 85,
        accuracyScore: 80,
        utilityScore: 78,
      } as ValidationResult);

    // Mock dependency: calculatePriorityScoreForIssue - 優先度スコアを返す
    const calculatePriorityScoreStub = jest
      .fn()
      .mockImplementation(
        (
          issueData: ExtractedIssueData,
        ): { priorityScore: number; category: string } => {
          if (issueData.issueId === "issue-001") {
            return { priorityScore: 82, category: "technical_critical" };
          } else if (issueData.issueId === "issue-002") {
            return { priorityScore: 65, category: "technical_medium" };
          } else {
            return { priorityScore: 48, category: "resource_low" };
          }
        },
      );

    // Mock dependency: extractAndRankIssuesFromReports - ランク付きリストを返す
    const extractAndRankIssuesStub = jest
      .fn()
      .mockResolvedValue([
        {
          issueId: "issue-001",
          issueContent: extractedIssueData1.issueContent,
          priorityScore: 82,
          category: "technical_critical",
          rank: 1,
        },
        {
          issueId: "issue-002",
          issueContent: extractedIssueData2.issueContent,
          priorityScore: 65,
          category: "technical_medium",
          rank: 2,
        },
        {
          issueId: "issue-003",
          issueContent: extractedIssueData3.issueContent,
          priorityScore: 48,
          category: "resource_low",
          rank: 3,
        },
      ] as CategorizedIssue[]);

    // Mock dependency: syncExtractedIssuesToExternalTool - 成功ステータスを返す
    const syncExtractedIssuesToExternalToolStub = jest
      .fn()
      .mockResolvedValue({
        status: "success",
        syncedIssueIds: [
          "jira-issue-001",
          "jira-issue-002",
          "jira-issue-003",
        ],
        failedSyncs: [],
      } as ToolIntegrationStatus);

    // Mock dependency: generateAndSendManagerConfirmationEmail - 送信成功を返す
    const generateAndSendManagerConfirmationEmailStub = jest
      .fn()
      .mockResolvedValue({ emailSent: true, emailId: "email-msg-001" });

    // Inject mocks into the agent orchestrator context
    // Note: runTx5Imp1Agent should be called with the mocked dependencies
    // In a real implementation, this would use dependency injection or a test double
    const output = await runTx5Imp1Agent(input, {
      validateReportQuality: validateReportQualityStub,
      calculatePriorityScoreForIssue: calculatePriorityScoreStub,
      extractAndRankIssuesFromReports: extractAndRankIssuesStub,
      syncExtractedIssuesToExternalTool: syncExtractedIssuesToExternalToolStub,
      generateAndSendManagerConfirmationEmail:
        generateAndSendManagerConfirmationEmailStub,
    } as any);

    // Assert: 期待結果を検証
    expect(output).toBeDefined();

    // (1) validationResult.status が 'passed' である
    expect(output.validationResult.status).toBe("passed");
    expect(output.validationResult.completenessScore).toBe(85);
    expect(output.validationResult.accuracyScore).toBe(80);
    expect(output.validationResult.utilityScore).toBe(78);

    // (2) categorizedIssueList が3件の CategorizedIssue オブジェクトを含む
    expect(output.categorizedIssueList).toHaveLength(3);
    expect(output.categorizedIssueList[0].issueId).toBe("issue-001");
    expect(output.categorizedIssueList[0].priorityScore).toBe(82);
    expect(output.categorizedIssueList[0].category).toBe("technical_critical");
    expect(output.categorizedIssueList[1].issueId).toBe("issue-002");
    expect(output.categorizedIssueList[1].priorityScore).toBe(65);
    expect(output.categorizedIssueList[1].category).toBe("technical_medium");
    expect(output.categorizedIssueList[2].issueId).toBe("issue-003");
    expect(output.categorizedIssueList[2].priorityScore).toBe(48);
    expect(output.categorizedIssueList[2].category).toBe("resource_low");

    // (3) toolIntegrationStatus.status が 'success' である
    expect(output.toolIntegrationStatus.status).toBe("success");
    expect(output.toolIntegrationStatus.syncedIssueIds).toHaveLength(3);
    expect(output.toolIntegrationStatus.syncedIssueIds).toEqual([
      "jira-issue-001",
      "jira-issue-002",
      "jira-issue-003",
    ]);

    // (4) exceptionCasesRequiringApproval が空配列または要素を含まない
    expect(output.exceptionCasesRequiringApproval).toBeDefined();
    expect(output.exceptionCasesRequiringApproval).toEqual([]);

    // (5) 設計済みエラーが発生しない
    // (上記のすべての検証が成功していることで確認)
  });
});