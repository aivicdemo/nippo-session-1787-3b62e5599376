import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 既存ツール連携API失敗時の重複通知排除', () => {
  // SCEN-1290
  test('同日内の複数ジョブ失敗時に部長への手動対応通知が重複しないこと', async () => {
    // Setup: NotificationServiceAdapterスタブの初期化
    const notificationLogs: Array<{ userId: string; jobId: string; timestamp: string; messageType: string }> = [];
    let sendReminderNotificationCallCount = 0;

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        sendReminderNotificationCallCount++;
        notificationLogs.push({
          userId,
          jobId: 'aggregated',
          timestamp: new Date('2024-01-15T11:30:00Z').toISOString(),
          messageType: 'manual_intervention_required'
        });
        // API失敗をシミュレート
        throw new Error('Notification service unavailable');
      }),
      scheduleNotification: jest.fn(async () => ({})),
      getDeliveryStatus: jest.fn(async () => ({ status: 'failed', retryCount: 3 }))
    };

    const mockAiClient: Tx5Imp1AiClient = {
      validateIssuesAndDeterminePriority: jest.fn(async (issues) => ({
        validatedIssues: issues.map((issue: ExtractedIssue) => ({
          issueId: issue.issueId,
          priorityScore: 75,
          priorityRank: 'high' as const,
          category: 'defect',
          toolIssueId: null,
          validationStatus: 'valid' as const
        }))
      })),
      classifyIssueCategory: jest.fn(async (issue) => ({ category: 'defect' })),
      determinePriorityWithRules: jest.fn(async (issue) => ({ priorityScore: 75 }))
    };

    // ジョブA: 課題データセット
    const jobAIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Timeout occurred in job A',
        frequency: 2,
        impactScore: 80
      }
    ];

    // ジョブB: 課題データセット（同日内の別のジョブ）
    const jobBIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-002',
        title: 'Memory leak detected',
        description: 'Memory leak occurred in job B',
        frequency: 1,
        impactScore: 70
      }
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      apiToken: 'test-token',
      projectKey: 'PROJ'
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40
    };

    const categoryMappings: CategoryMapping[] = [
      { systemCategory: 'defect', toolCategory: 'Bug' }
    ];

    // ジョブA実行
    const jobAInput = {
      extractedIssueData: jobAIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings
    };

    let jobAError: Error | null = null;
    try {
      await runTx5Imp1Agent(jobAInput, mockAiClient);
    } catch (err) {
      jobAError = err instanceof Error ? err : new Error(String(err));
    }

    // ジョブA後の通知ログ確認
    const logsAfterJobA = [...notificationLogs];
    const jobANotificationCount = logsAfterJobA.length;

    // ジョブB実行（同日内）
    const jobBInput = {
      extractedIssueData: jobBIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings
    };

    let jobBError: Error | null = null;
    try {
      await runTx5Imp1Agent(jobBInput, mockAiClient);
    } catch (err) {
      jobBError = err instanceof Error ? err : new Error(String(err));
    }

    // 最終的な通知ログ確認
    const totalNotificationCount = notificationLogs.length;
    const uniqueManagerNotifications = notificationLogs.filter(
      log => log.messageType === 'manual_intervention_required'
    );

    // Assertions
    // 期待: 通知配信ログに記録される部長への手動対応通知は1件のみ
    expect(uniqueManagerNotifications.length).toBe(1);

    // 期待: sendReminderNotificationが呼び出される回数は1回のみ（重複排除ロジックが機能）
    expect(sendReminderNotificationCallCount).toBe(1);

    // 期待: 同一部長ユーザーに対する重複通知が生成されていないこと
    expect(totalNotificationCount).toBe(1);

    // 期待: 通知が記録されていること
    expect(uniqueManagerNotifications[0].userId).toBeDefined();
    expect(uniqueManagerNotifications[0].timestamp).toBe('2024-01-15T11:30:00Z');
  });
});