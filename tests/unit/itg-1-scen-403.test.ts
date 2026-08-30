import { syncExtractedIssuesToExternalTool, type ToolIntegrationRequest } from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-403
  test('既存ツールからの連携結果が返却されていないとき、タイムアウトエラーが発生する', () => {
    const toolIntegrationRequest: ToolIntegrationRequest = {
      extractedIssueDataList: [
        {
          id: 'issue-1',
          title: '課題1',
          priority: 'high',
          assignee: 'user-A',
        },
        {
          id: 'issue-2',
          title: '課題2',
          priority: 'medium',
          assignee: 'user-B',
        },
      ],
      externalToolType: 'jira',
      toolApiEndpoint: 'https://api.jira.test',
      toolApiAuthToken: 'valid-token',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 3,
    };

    expect(() => {
      syncExtractedIssuesToExternalTool(toolIntegrationRequest);
    }).toThrow(/タイムアウト/);
  });
});