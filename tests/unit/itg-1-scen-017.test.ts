import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  ExtractedIssueData,
  ExternalToolConfiguration,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("tx-5-imp-1 orchestrator", () => {
  // SCEN-017: [error] 抽出済み課題データが形式不正または必須項目欠落の場合、検証エラーが発生し後続処理が中止される
  test("should throw InvalidExtractedIssueDataError when extracted issue data has missing required fields", async () => {
    // 必須項目が欠落した抽出済み課題データを準備
    const incompleteExtractedIssueData: ExtractedIssueData[] = [
      {
        issueId: "ISS-001",
        issueContent: "Database connection timeout occurs frequently",
        extractedKeywords: ["timeout", "database"],
        occurrenceFrequency: 5,
        impactScore: 75,
        reportSourceIds: ["RPT-2024-001", "RPT-2024-002"],
      },
      {
        // 必須項目 issueId が欠落
        issueId: "", // 空の issueId
        issueContent: "Memory leak detected in production",
        extractedKeywords: ["memory", "leak"],
        occurrenceFrequency: 3,
        impactScore: 85,
        reportSourceIds: ["RPT-2024-003"],
      },
    ];

    const projectManagerId = "PM-12345";

    const externalToolConfig: ExternalToolConfiguration = {
      toolType: "jira",
      apiBaseUrl: "https://jira.example.com/rest/api/3",
      apiToken: "test-api-token",
      projectKey: "DEV",
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueDataList: incompleteExtractedIssueData,
      projectManagerId: projectManagerId,
      externalToolConfig: externalToolConfig,
      validationThresholds: {
        minPriorityScore: 40,
        maxOccurrenceFrequency: 30,
        minImpactScore: 20,
      },
    };

    // runTx5Imp1Agent を呼び出し、InvalidExtractedIssueDataError が発生することを検証
    await expect(runTx5Imp1Agent(input)).rejects.toThrow(
      /抽出済み課題データの形式が不正です/
    );

    // エラーメッセージが完全に一致することを検証
    try {
      await runTx5Imp1Agent(input);
      fail("Expected error to be thrown");
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBe(
          "抽出済み課題データの形式が不正です。検証を中止し、プロジェクトマネージャーに修正を依頼してください。"
        );
      }
    }
  });
});