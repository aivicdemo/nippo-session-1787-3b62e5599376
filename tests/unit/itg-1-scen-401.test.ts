import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import type {
  ToolIntegrationRequest,
  ToolIntegrationResult,
  DataConsistencyCheckResult,
} from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-401: 抽出済み課題データが空配列のときスキップ
  test('抽出済み課題データが空配列のとき連携処理をスキップし成功ステータスを返す', () => {
    const requestPayload: ToolIntegrationRequest = {
      extractedIssueDataList: [],
      externalToolType: 'jira',
      toolApiEndpoint: 'https://jira.example.com/api',
      toolApiAuthToken: 'valid_token_12345',
      projectManagerId: 'pm_user_001',
      maxRetryAttempts: 3,
    };

    const result: ToolIntegrationResult =
      syncExtractedIssuesToExternalTool(requestPayload);

    expect(result.integrationStatus).toBe('success');
    expect(result.syncedIssueCount).toBe(0);
    expect(result.failedIssueCount).toBe(0);
    expect(result.duplicateIssuesMerged).toBe(0);
    expect(result.retryAttemptsExecuted).toBe(0);
    expect(result.managerNotificationRequired).toBe(false);
    expect(result.failureReasonIfAny).toBeNull();

    const consistencyResult: DataConsistencyCheckResult =
      result.dataConsistencyValidationResult;
    expect(consistencyResult.isConsistent).toBe(true);
    expect(consistencyResult.expectedIssueCount).toBe(0);
    expect(consistencyResult.actualIssueCountInTool).toBe(0);
    expect(consistencyResult.fieldMappingValidation).toBe(true);
    expect(consistencyResult.statusSyncValidation).toBe(true);

    const completedAtDate = new Date(result.integrationCompletedAt);
    expect(completedAtDate).toBeInstanceOf(Date);
    expect(completedAtDate.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );
  });
});