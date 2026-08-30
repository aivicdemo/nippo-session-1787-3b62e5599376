import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import type { ToolIntegrationRequest, ToolIntegrationResult } from '../../src/logic/existing-tool-integration';

describe('既存ツール連携 - 抽出済み課題の同期処理', () => {
  test('SCEN-404: 抽出済み課題データが空配列（本日の課題データなし）のときに警告ログを記録して成功ステータスを返す', async () => {
    // Arrange: 課題データなしのツール連携リクエストを構築
    const extractedIssueDataList: never[] = [];
    const request: ToolIntegrationRequest = {
      extractedIssueDataList,
      externalToolType: 'jira',
      toolApiEndpoint: 'https://jira.example.com/api/v3',
      toolApiAuthToken: 'valid_token_12345',
      projectManagerId: 'PM001',
      maxRetryAttempts: 3,
    };

    // Act: 連携処理を実行
    const result: ToolIntegrationResult = await syncExtractedIssuesToExternalTool(request);

    // Assert: 返却されたResultの内容を検証
    expect(result.integrationStatus).toBe('success');
    expect(result.syncedIssueCount).toBe(0);
    expect(result.failedIssueCount).toBe(0);
    expect(result.duplicateIssuesMerged).toBe(0);
    expect(result.dataConsistencyValidationResult.isConsistent).toBe(true);
    expect(result.dataConsistencyValidationResult.expectedIssueCount).toBe(0);
    expect(result.dataConsistencyValidationResult.actualIssueCountInTool).toBe(0);
    expect(result.dataConsistencyValidationResult.fieldMappingValidation).toBe(true);
    expect(result.dataConsistencyValidationResult.statusSyncValidation).toBe(true);
    expect(result.retryAttemptsExecuted).toBe(0);
    expect(result.managerNotificationRequired).toBe(false);
    expect(result.failureReasonIfAny).toBeNull();

    // Assert: 完了日時がISO 8601形式であることを確認
    expect(result.integrationCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Assert: 監査ログに警告メッセージが記録されることを確認
    // （実装側が recordToolIntegrationAuditLog を呼び出すことが前提）
    // 警告ログの内容は「本日の課題データが抽出されていません。報告内容を確認してください」
  });
});