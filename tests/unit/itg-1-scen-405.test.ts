import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import { type ToolIntegrationRequest, type ToolIntegrationResult } from '../../src/logic/existing-tool-integration';

describe('existing-tool-integration', () => {
  test('SCEN-405: [error] sent issue count below 50% of expected triggers partial_failure with manager notification', async () => {
    // テスト用の抽出済み課題データを準備（10件）
    const extractedIssueDataList = Array.from({ length: 10 }, (_, index) => ({
      issueId: `extracted-issue-${index + 1}`,
      issueContent: `Issue content ${index + 1}`,
      priorityScore: 50 + index * 2,
      impactLevel: 'medium' as const,
      extractedKeywords: [`keyword-${index + 1}`],
      reportDate: '2024-01-15T09:00:00Z',
      reporterId: `engineer-${index + 1}`,
      teamId: 'team-001',
    }));

    const toolIntegrationRequest: ToolIntegrationRequest = {
      extractedIssueDataList,
      externalToolType: 'jira',
      toolApiEndpoint: 'https://jira.example.com/api/v3',
      toolApiAuthToken: 'valid-auth-token-12345',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 3,
    };

    // 既存ツール連携API呼び出しをモック：4件のみ送信成功（期待件数10件の40%、50%未満）
    const mockExecuteToolApiCallWithRetry = jest.fn().mockResolvedValue({
      success: true,
      toolIssueIds: ['JIRA-1001', 'JIRA-1002', 'JIRA-1003', 'JIRA-1004'],
      failedIssueIds: [],
      httpStatusCode: 200,
      retryCount: 0,
      executionTimeMs: 1500,
    });

    // データ整合性検証をモック：送信件数4件を返す
    const mockVerifyToolIntegrationDataConsistency = jest.fn().mockResolvedValue({
      isConsistent: false,
      inconsistencies: [
        {
          type: 'record_count_mismatch',
          severity: 'critical',
          details: 'Expected 10 issues but only 4 were synced. Sent: 4, Registered: 4',
        },
      ],
      requiresResync: true,
    });

    // バリデーション・正規化・監査ログをモック
    const mockValidateIssueDataForToolIntegration = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
    });

    const mockNormalizeIssueDataForExternalTool = jest.fn().mockResolvedValue({
      normalizedIssues: extractedIssueDataList.map((issue, index) => ({
        externalToolTitle: `JIRA Issue ${index + 1}`,
        externalToolDescription: issue.issueContent,
        externalToolPriority: 'Medium',
        externalToolAssignee: `assignee-${index + 1}`,
        externalToolStatus: 'To Do',
      })),
      mappingMetadata: {
        fieldMappings: {
          'issueContent': 'description',
          'priorityScore': 'priority',
          'impactLevel': 'custom_impact',
        },
        valueTransformations: {
          'medium': 'Medium',
          'high': 'High',
          'low': 'Low',
        },
      },
      normalizationTimestamp: '2024-01-15T09:05:00Z',
    });

    const mockRecordToolIntegrationAuditLog = jest.fn().mockResolvedValue({
      auditLogId: 'audit-log-001',
      recordedTimestamp: new Date('2024-01-15T09:06:00Z'),
      persistenceStatus: 'recorded',
    });

    // 関数を呼び出す（実装では依存関数をDIされることを想定）
    // ここでは実装内で依存関数をモック化する想定で、実際の関数を呼び出す
    const result: ToolIntegrationResult = await syncExtractedIssuesToExternalTool(
      toolIntegrationRequest,
      {
        executeToolApiCallWithRetry: mockExecuteToolApiCallWithRetry,
        verifyToolIntegrationDataConsistency: mockVerifyToolIntegrationDataConsistency,
        validateIssueDataForToolIntegration: mockValidateIssueDataForToolIntegration,
        normalizeIssueDataForExternalTool: mockNormalizeIssueDataForExternalTool,
        recordToolIntegrationAuditLog: mockRecordToolIntegrationAuditLog,
      },
    );

    // 検証：integrationStatus が 'partial_failure' であること
    expect(result.integrationStatus).toBe('partial_failure');

    // 検証：syncedIssueCount が4件であること
    expect(result.syncedIssueCount).toBe(4);

    // 検証：failureReasonIfAny に「連携データの大部分が送信されていません。既存ツール側の設定を確認してください」という文言が含まれていること
    expect(result.failureReasonIfAny).toMatch(/連携データの大部分が送信されていません/);
    expect(result.failureReasonIfAny).toMatch(/既存ツール側の設定を確認してください/);

    // 検証：managerNotificationRequired が true であること（部長への手動対応通知が必要）
    expect(result.managerNotificationRequired).toBe(true);

    // 検証：failedIssueCount が6件であること（10件 - 4件 = 6件）
    expect(result.failedIssueCount).toBe(6);

    // 検証：duplicateIssuesMerged が0件であること
    expect(result.duplicateIssuesMerged).toBe(0);

    // 検証：dataConsistencyValidationResult が返されていること
    expect(result.dataConsistencyValidationResult).toBeDefined();
    expect(result.dataConsistencyValidationResult.isConsistent).toBe(false);
    expect(result.dataConsistencyValidationResult.expectedIssueCount).toBe(10);
    expect(result.dataConsistencyValidationResult.actualIssueCountInTool).toBe(4);

    // 検証：retryAttemptsExecuted が記録されていること
    expect(result.retryAttemptsExecuted).toBe(0);

    // 検証：integrationCompletedAt が ISO 8601 形式の文字列であること
    expect(result.integrationCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});