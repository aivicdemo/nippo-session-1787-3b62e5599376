import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import { type ToolIntegrationResult } from '../../src/logic/existing-tool-integration';

describe('existing-tool-integration', () => {
  test('SCEN-392: [normal] 抽出済み課題データを既存ツール（JiraまたはAsana）に連携し、API通信、重複排除、データ整合性検証、リトライ処理を実行して連携完了ステータスを記録する', () => {
    const extractedIssuesInput = [
      {
        issueId: 'issue-001',
        title: 'ビルドエラー',
        category: 'technical',
        priority: 85,
        frequency: 5,
      },
      {
        issueId: 'issue-002',
        title: 'テスト失敗',
        category: 'quality',
        priority: 75,
        frequency: 3,
      },
      {
        issueId: 'issue-003',
        title: 'パフォーマンス低下',
        category: 'performance',
        priority: 65,
        frequency: 2,
      },
      {
        issueId: 'issue-004',
        title: 'デプロイ遅延',
        category: 'process',
        priority: 55,
        frequency: 1,
      },
      {
        issueId: 'issue-005',
        title: 'セキュリティ脆弱性',
        category: 'security',
        priority: 95,
        frequency: 4,
      },
    ];

    const toolApiResponseInput = [
      {
        issueId: 'issue-001',
        externalId: 'JIRA-001',
        status: 'success',
        errorMessage: null,
      },
      {
        issueId: 'issue-002',
        externalId: 'JIRA-002',
        status: 'success',
        errorMessage: null,
      },
      {
        issueId: 'issue-003',
        externalId: 'JIRA-003',
        status: 'success',
        errorMessage: null,
      },
      {
        issueId: 'issue-004',
        externalId: 'JIRA-004',
        status: 'success',
        errorMessage: null,
      },
      {
        issueId: 'issue-005',
        externalId: 'JIRA-005',
        status: 'success',
        errorMessage: null,
      },
    ];

    const result: ToolIntegrationResult = syncExtractedIssuesToExternalTool(
      extractedIssuesInput,
      'jira',
      toolApiResponseInput,
      5
    );

    expect(result.integrationSuccess).toBe(true);
    expect(result.successCount).toBe(5);
    expect(result.failureCount).toBe(0);
    expect(result.duplicateCount).toBe(0);
    expect(result.missingCount).toBe(0);
    expect(result.validationStatus).toBe('passed');
    expect(result.details).toHaveLength(5);
    expect(result.details.every((detail) => detail.result === 'success')).toBe(
      true
    );
    expect(
      result.details.every((detail) => detail.externalId !== null)
    ).toBe(true);
  });
});