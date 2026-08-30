import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import { type ToolIntegrationRequest, type ToolIntegrationResult } from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-400: ツール接続設定が不完全または無効のときの処理
  test('ツール接続設定が無効な場合、リトライをスキップして失敗ステータスを返す', () => {
    const extractedIssueDataList = [
      {
        issueId: 'ISSUE-001',
        issueContent: '説明1',
        priorityScore: 75,
        impactLevel: 'high' as const,
        extractedKeywords: ['バグ'],
        reportDate: '2024-01-15',
        reporterId: 'ENG-001',
        teamId: 'TEAM-001'
      }
    ];

    const request: ToolIntegrationRequest = {
      extractedIssueDataList,
      externalToolType: 'jira',
      toolApiEndpoint: null as any,
      toolApiAuthToken: '',
      projectManagerId: 'PM-001',
      maxRetryAttempts: 3
    };

    const result: ToolIntegrationResult = syncExtractedIssuesToExternalTool(request);

    expect(result.integrationStatus).toBe('failure');
    expect(result.failureReasonIfAny).toMatch(/ツール接続設定/);
    expect(result.retryAttemptsExecuted).toBe(0);
    expect(result.managerNotificationRequired).toBe(true);
    expect(result.syncedIssueCount).toBe(0);
    expect(result.failedIssueCount).toBe(1);
  });
});