import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import type { ToolIntegrationRequest, ToolIntegrationResult, ExtractedIssueData } from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-099: [normal] 抽出済み課題データを既存ツール（JiraまたはAsana）に連携し、API通信、重複排除、データ整合性検証、リトライ処理を実行して連携完了ステータスを記録する
  test('syncExtractedIssuesToExternalToolが代表的な正常入力を設計どおり処理する', async () => {
    const extractedIssueDataList: ExtractedIssueData[] = [
      {
        issueId: 'issue-001',
        title: 'ビルドエラーの修正',
        description: 'メインブランチのビルドが失敗している。コンパイラエラーを確認し修正が必要。',
        severity: 'high',
        reportedDate: '2024-01-15',
        reporterId: 'eng-001',
        teamId: 'team-001',
        keywords: ['ビルド', 'エラー']
      },
      {
        issueId: 'issue-002',
        title: 'テスト環境の不安定性',
        description: 'テスト環境のデータベース接続が間欠的に失敗。リソース不足の可能性。',
        severity: 'medium',
        reportedDate: '2024-01-15',
        reporterId: 'eng-002',
        teamId: 'team-001',
        keywords: ['テスト', 'リソース']
      },
      {
        issueId: 'issue-003',
        title: 'API応答時間の低下',
        description: 'プロダクション環境でAPI応答時間が平均5秒に増加。パフォーマンス最適化が必要。',
        severity: 'medium',
        reportedDate: '2024-01-15',
        reporterId: 'eng-003',
        teamId: 'team-001',
        keywords: ['パフォーマンス', 'API']
      }
    ];

    const request: ToolIntegrationRequest = {
      extractedIssueDataList,
      externalToolType: 'jira',
      toolApiEndpoint: 'https://api.atlassian.com/rest/api/3/issues',
      toolApiAuthToken: 'valid-jira-api-token-abc123xyz',
      projectManagerId: 'pm-001',
      maxRetryAttempts: undefined
    };

    const fixedCompletionTime = '2024-01-15T09:30:00Z';

    const result = await syncExtractedIssuesToExternalTool(request);

    expect(result).toHaveProperty('integrationStatus');
    expect(result.integrationStatus).toBe('success');
    expect(result.syncedIssueCount).toBe(3);
    expect(result.failedIssueCount).toBe(0);
    expect(result.duplicateIssuesMerged).toBe(0);
    expect(result.retryAttemptsExecuted).toBe(0);
    expect(result.managerNotificationRequired).toBe(false);
    expect(result.failureReasonIfAny).toBeNull();

    expect(result.integrationCompletedAt).toBeDefined();
    expect(typeof result.integrationCompletedAt).toBe('string');
    const completionDateTime = new Date(result.integrationCompletedAt);
    expect(completionDateTime.toISOString()).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);

    expect(result.dataConsistencyValidationResult).toBeDefined();
    expect(result.dataConsistencyValidationResult.isConsistent).toBe(true);
    expect(result.dataConsistencyValidationResult.expectedIssueCount).toBe(3);
    expect(result.dataConsistencyValidationResult.actualIssueCountInTool).toBe(3);
    expect(result.dataConsistencyValidationResult.fieldMappingValidation).toBe(true);
    expect(result.dataConsistencyValidationResult.statusSyncValidation).toBe(true);
  });
});