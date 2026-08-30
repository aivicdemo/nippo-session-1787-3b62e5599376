import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import type { ToolIntegrationRequest } from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-393: [error] 抽出済み課題データが空配列のときに連携対象の課題がありませんエラーをスロー
  test('should throw error when extractedIssueDataList is empty array', () => {
    const request: ToolIntegrationRequest = {
      extractedIssueDataList: [],
      externalToolType: 'jira',
      toolApiEndpoint: 'https://api.atlassian.com/issues',
      toolApiAuthToken: 'valid-token-abc123',
      projectManagerId: 'PM001',
      maxRetryAttempts: 3,
    };

    expect(() => syncExtractedIssuesToExternalTool(request)).toThrow(/連携対象の課題がありません/);
  });
});