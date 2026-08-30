import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-399
  test('エラータイプが空文字列のときは例外がスローされること', () => {
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        issueContent: 'This is a test issue with sufficient content for validation purposes',
        priorityScore: 75,
        impactLevel: 'high' as const,
        extractedKeywords: ['bug', 'urgent'],
        reportDate: '2024-01-15',
        reporterId: 'eng-001',
        teamId: 'team-001'
      }
    ];

    const toolConnectionConfig = {
      apiEndpoint: 'https://jira.example.com/api/v3',
      apiAuthToken: 'test-auth-token-12345',
      toolType: 'jira' as const
    };

    const result = expect(() =>
      syncExtractedIssuesToExternalTool(
        1,
        '',
        extractedIssueData,
        toolConnectionConfig
      )
    ).toThrow(/エラーの種類を指定してください/);

    expect(result).toBeDefined();
  });
});