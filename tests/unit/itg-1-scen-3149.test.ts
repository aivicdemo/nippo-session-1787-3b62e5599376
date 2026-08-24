import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping, type ValidatedIssue, type ToolIntegrationResult, type ExecutionSummary } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  test('SCEN-3149: [normal] action-03 既存ツール連携設定を実行し、スタブクライアント経由で Jira・Asana API 呼び出しが完結し、連携完了ステータスが記録される', async () => {
    // ========== Setup: テスト用の抽出済み課題データ ==========
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        title: 'Database connection timeout',
        description: 'Connection fails after 30 seconds of inactivity',
        extractedAt: new Date('2024-01-15T09:00:00Z'),
        confidence: 0.95,
        keywords: ['database', 'timeout', 'connection'],
        frequencyCount: 3,
      },
      {
        issueId: 'ISSUE-002',
        title: 'Memory leak in cache layer',
        description: 'Cache objects not being garbage collected properly',
        extractedAt: new Date('2024-01-15T09:05:00Z'),
        confidence: 0.88,
        keywords: ['memory', 'cache', 'leak'],
        frequencyCount: 2,
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      endpoint: 'https://api.jira.example.com',
      projectKey: 'TECH',
      apiToken: 'token_stub_do_not_use_in_production',
      isActive: true,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategory: 'database',
        targetCategory: 'Infrastructure',
        toolSpecificCategory: 'Backend - Database',
      },
      {
        sourceCategory: 'memory',
        targetCategory: 'Performance',
        toolSpecificCategory: 'Backend - Performance',
      },
    ];

    // ========== Setup: スタブ AI クライアント ==========
    const stubAiClient: Tx5Imp1AiClient = {
      // Action-01: 課題データ検証
      validateIssueData: jest.fn(async (issues) => {
        return {
          validatedIssues: issues.map((issue) => ({
            issueId: issue.issueId,
            title: issue.title,
            description: issue.description,
            extractedAt: issue.extractedAt,
            confidence: issue.confidence,
            keywords: issue.keywords,
            validationStatus: 'valid' as const,
            validationErrors: [],
          })),
          validationTimestamp: new Date('2024-01-15T09:10:00Z'),
        };
      }),

      // Action-02: 優先度・カテゴリ判定
      judgePriorityAndCategory: jest.fn(async (issues, rules) => {
        return issues.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: 75,
          priorityRank: 'high' as const,
          category: 'Infrastructure',
          toolSpecificCategory: 'Backend - Database',
        }));
      }),

      // Action-03: 既存ツール連携設定を実行
      executeToolIntegration: jest.fn(async (validatedIssues, config) => {
        const registeredIssues = validatedIssues.map((issue, index) => ({
          issueId: issue.issueId,
          toolIssueId: `JIRA-${1001 + index}`,
          toolName: 'jira',
          registrationTimestamp: new Date('2024-01-15T09:15:00Z'),
          registrationStatus: 'success' as const,
        }));
        return {
          successCount: registeredIssues.length,
          failureCount: 0,
          registeredIssues,
          toolName: 'jira',
          integrationStartTime: new Date('2024-01-15T09:12:00Z'),
          integrationEndTime: new Date('2024-01-15T09:15:00Z'),
        };
      }),

      // Action-04: Jira・Asana等への登録を完了
      finalizeToolRegistration: jest.fn(async (integrationResult) => {
        return {
          finalizeTimestamp: new Date('2024-01-15T09:16:00Z'),
          finalizeStatus: 'completed' as const,
          summary: `Successfully registered ${integrationResult.successCount} issues to ${integrationResult.toolName}`,
        };
      }),

      // Action-05: 連携完了ステータスを記録・通知
      recordIntegrationCompletion: jest.fn(async (finalizationResult) => {
        return {
          recordedAt: new Date('2024-01-15T09:17:00Z'),
          integrationStatus: 'COMPLETED',
          notificationSent: true,
          auditLogId: 'AUDIT-20240115-001',
        };
      }),
    };

    // ========== Execute: オーケストレータ呼び出し ==========
    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      stubAiClient
    );

    // ========== Verify: Action-03 が呼び出されたことを確認 ==========
    expect(stubAiClient.validateIssueData).toHaveBeenCalledTimes(1);
    expect(stubAiClient.judgePriorityAndCategory).toHaveBeenCalledTimes(1);
    expect(stubAiClient.executeToolIntegration).toHaveBeenCalledTimes(1);
    expect(stubAiClient.finalizeToolRegistration).toHaveBeenCalledTimes(1);
    expect(stubAiClient.recordIntegrationCompletion).toHaveBeenCalledTimes(1);

    // ========== Verify: executeToolIntegration の呼び出し順序と引数 ==========
    const executeToolIntegrationCall = (stubAiClient.executeToolIntegration as jest.Mock).mock.calls[0];
    expect(executeToolIntegrationCall).toBeDefined();
    expect(executeToolIntegrationCall[1].toolType).toBe('jira');
    expect(executeToolIntegrationCall[1].projectKey).toBe('TECH');

    // ========== Verify: 返却値の構造と内容 ==========
    expect(result).toBeDefined();
    expect(result.validatedIssues).toHaveLength(2);
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBe(2);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.toolName).toBe('jira');

    // ========== Verify: 登録済み課題 ID が正しく設定されている ==========
    expect(result.integrationResult.registeredIssues).toHaveLength(2);
    expect(result.integrationResult.registeredIssues[0].toolIssueId).toBe('JIRA-1001');
    expect(result.integrationResult.registeredIssues[0].toolName).toBe('jira');
    expect(result.integrationResult.registeredIssues[0].registrationStatus).toBe('success');
    expect(result.integrationResult.registeredIssues[1].toolIssueId).toBe('JIRA-1002');

    // ========== Verify: ExecutionSummary に連携完了ステータスが記録されている ==========
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.integrationStatus).toBe('COMPLETED');
    expect(result.executionSummary.auditLogId).toBe('AUDIT-20240115-001');
    expect(result.executionSummary.notificationSent).toBe(true);

    // ========== Verify: validatedIssues が優先度・カテゴリを含む ==========
    expect(result.validatedIssues[0].priorityScore).toBe(75);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].category).toBe('Infrastructure');
    expect(result.validatedIssues[0].toolIssueId).toBe('JIRA-1001');
    expect(result.validatedIssues[0].validationStatus).toBe('valid');

    // ========== Verify: エスカレーション条件が未発動 ==========
    expect(result.executionSummary.escalationTriggered).toBe(false);
    expect(result.executionSummary.escalationReason).toBeUndefined();

    // ========== Verify: タイムスタンプが正しく記録されている ==========
    expect(result.integrationResult.integrationStartTime).toEqual(new Date('2024-01-15T09:12:00Z'));
    expect(result.integrationResult.integrationEndTime).toEqual(new Date('2024-01-15T09:15:00Z'));
    expect(result.executionSummary.recordedAt).toEqual(new Date('2024-01-15T09:17:00Z'));
  });
});