import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { syncExtractedIssuesToExternalTool } from "../../src/logic/existing-tool-integration";

describe("existing-tool-integration", () => {
  test("SCEN-394: API応答が受け取れない場合、通信失敗エラーをスロー", async () => {
    // ステップ1-5: 依存関数をモック化
    const mockExecuteToolApiCallWithRetry = jest.fn();
    const mockValidateIssueDataForToolIntegration = jest.fn();
    const mockNormalizeIssueDataForExternalTool = jest.fn();
    const mockVerifyToolIntegrationDataConsistency = jest.fn();
    const mockRecordToolIntegrationAuditLog = jest.fn();

    // API応答が受け取れない状態をシミュレート（null を返す）
    mockExecuteToolApiCallWithRetry.mockResolvedValue(null);

    // 入力データ検証成功
    mockValidateIssueDataForToolIntegration.mockResolvedValue({
      isValid: true,
      errors: [],
    });

    // データ正規化成功
    mockNormalizeIssueDataForExternalTool.mockResolvedValue({
      normalizedIssues: [
        {
          id: "ISS-001",
          title: "テスト課題1",
          category: "Bug",
          priority: 5,
          frequency: 2,
        },
      ],
      mappingMetadata: {
        fieldMappings: { id: "key", title: "summary" },
        valueTransformations: { Bug: "BUG" },
      },
      normalizationTimestamp: "2024-01-15T11:00:00Z",
    });

    // 検証結果を返す
    mockVerifyToolIntegrationDataConsistency.mockResolvedValue({
      isConsistent: false,
      inconsistencies: [
        {
          type: "record_count_mismatch",
          severity: "critical",
          details: "API response was null",
        },
      ],
      requiresResync: true,
    });

    // 監査ログ記録成功
    mockRecordToolIntegrationAuditLog.mockResolvedValue({
      auditLogId: "AUDIT-001",
      recordedTimestamp: new Date("2024-01-15T11:00:00Z"),
      persistenceStatus: "recorded",
    });

    // ステップ6: 入力値を設定
    const extractedIssueDataList = [
      {
        id: "ISS-001",
        title: "テスト課題1",
        category: "Bug",
        priority: 5,
        frequency: 2,
      },
    ];
    const externalToolType = "jira";
    const toolApiEndpoint = "https://api.jira.example.com/rest/api/3";
    const toolApiAuthToken = "invalid-token-for-test";
    const projectManagerId = "PM-001";
    const maxRetryAttempts = 3;

    // ステップ7: API応答が3回のリトライ後にnullのままであることをシミュレート
    mockExecuteToolApiCallWithRetry.mockResolvedValue(null);

    // ステップ4: 関数を呼び出し、例外がスローされることを期待
    await expect(
      syncExtractedIssuesToExternalTool(
        extractedIssueDataList,
        externalToolType,
        toolApiEndpoint,
        toolApiAuthToken,
        projectManagerId,
        maxRetryAttempts
      )
    ).rejects.toThrow(/通信に失敗/);
  });
});