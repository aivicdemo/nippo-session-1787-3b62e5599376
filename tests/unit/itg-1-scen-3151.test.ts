import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  test('SCEN-3151: Action 5 実行時に連携完了ステータスを記録・通知する', async () => {
    // ===============================================
    // 準備: テスト用の抽出済み課題データセット
    // ===============================================
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Query execution takes over 60 seconds',
        initialPriority: 'high',
        categorySuggestion: 'performance',
        toolIntegrationState: 'pending',
      },
      {
        issueId: 'issue-002',
        title: 'Memory leak in background service',
        description: 'Memory usage grows 5% per hour',
        initialPriority: 'high',
        categorySuggestion: 'reliability',
        toolIntegrationState: 'pending',
      },
      {
        issueId: 'issue-003',
        title: 'API response delay',
        description: 'P95 latency exceeds 2 seconds',
        initialPriority: 'medium',
        categorySuggestion: 'performance',
        toolIntegrationState: 'pending',
      },
    ];

    const toolIntegrationConfig = {
      primaryTool: 'jira' as const,
      secondaryTool: 'asana' as const,
      apiEndpoints: {
        jira: 'https://jira.example.com/rest/api/3',
        asana: 'https://app.asana.com/api/1.0',
      },
      authTokens: {
        jira: 'mock-jira-token',
        asana: 'mock-asana-token',
      },
    };

    const priorityRules = {
      highImpactWeight: 0.6,
      frequencyWeight: 0.4,
      thresholds: {
        high: 70,
        medium: 40,
        low: 0,
      },
    };

    const categoryMappings = [
      {
        systemCategory: 'performance',
        jiraCategory: 'Performance',
        asanaCategory: 'Performance Issue',
      },
      {
        systemCategory: 'reliability',
        jiraCategory: 'Reliability',
        asanaCategory: 'Reliability Issue',
      },
    ];

    // ===============================================
    // 準備: Tx5Imp1AiClient のモック実装
    // ===============================================
    const mockAiClient: Tx5Imp1AiClient = {
      executeAction01: async () => ({
        validatedIssues: extractedIssueData.map(issue => ({
          issueId: issue.issueId,
          title: issue.title,
          description: issue.description,
          priorityScore: issue.initialPriority === 'high' ? 85 : 50,
          priorityRank: issue.initialPriority as 'high' | 'medium' | 'low',
          category: issue.categorySuggestion,
          toolIssueId: null,
          validationStatus: 'valid' as const,
        })),
      }),
      executeAction02: async () => ({
        priorityJudgments: [
          {
            issueId: 'issue-001',
            priorityScore: 82,
            category: 'performance',
          },
          {
            issueId: 'issue-002',
            priorityScore: 88,
            category: 'reliability',
          },
          {
            issueId: 'issue-003',
            priorityScore: 55,
            category: 'performance',
          },
        ],
      }),
      executeAction03: async () => ({
        classificationResult: {
          issues: [
            {
              issueId: 'issue-001',
              jiraCategory: 'Performance',
              asanaCategory: 'Performance Issue',
            },
            {
              issueId: 'issue-002',
              jiraCategory: 'Reliability',
              asanaCategory: 'Reliability Issue',
            },
            {
              issueId: 'issue-003',
              jiraCategory: 'Performance',
              asanaCategory: 'Performance Issue',
            },
          ],
        },
      }),
      executeAction04: async () => ({
        toolIntegrationPrepared: true,
        targetToolConfigs: [
          {
            toolName: 'jira',
            issueCount: 3,
            mappingStatus: 'ready',
          },
          {
            toolName: 'asana',
            issueCount: 3,
            mappingStatus: 'ready',
          },
        ],
      }),
      executeAction05: async () => ({
        status: 'completed',
        recordedAt: '2024-01-15T11:30:00Z',
        notificationSent: true,
        toolSyncStatus: {
          jira: 'synced',
          asana: 'synced',
        },
        escalationCount: 0,
      }),
    };

    // ===============================================
    // 準備: NotificationServiceAdapter のスタブ
    // ===============================================
    const notificationStub = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({
          deliveryStatus: 'success',
          timestamp: '2024-01-15T11:30:05Z',
          recipientId: 'admin',
          messageContent:
            '課題連携完了：3件、Jira同期成功、Asana同期成功、エスカレーション対象0件、完了時刻 11:30:00',
        }),
    };

    // ===============================================
    // 準備: 監査ログ記録用の配列（実装内で使用される想定）
    // ===============================================
    const auditLogs: Array<{
      eventType: string;
      actor: string;
      timestamp: string;
      inputSummary: string;
      outputStatus: string;
    }> = [];

    // ===============================================
    // 実行: runTx5Imp1Agent を実行
    // ===============================================
    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockAiClient,
      notificationStub,
      auditLogs
    );

    // ===============================================
    // 検証 1: 戻り値が期待値と一致する
    // ===============================================
    expect(result).toEqual({
      status: 'completed',
      recordedAt: '2024-01-15T11:30:00Z',
      notificationSent: true,
      toolSyncStatus: {
        jira: 'synced',
        asana: 'synced',
      },
      escalationCount: 0,
    });

    // ===============================================
    // 検証 2: NotificationServiceAdapter の呼び出し確認
    // ===============================================
    expect(notificationStub.sendReminderNotification).toHaveBeenCalled();
    const notificationCall =
      notificationStub.sendReminderNotification.mock.calls[0];
    expect(notificationCall).toBeDefined();

    // 通知内容に必要な情報が含まれていることを確認
    const notificationContent = notificationCall[0];
    expect(notificationContent).toMatch(/3件/);
    expect(notificationContent).toMatch(/Jira同期成功/);
    expect(notificationContent).toMatch(/Asana同期成功/);
    expect(notificationContent).toMatch(/エスカレーション対象0件/);
    expect(notificationContent).toMatch(/11:30:00/);

    // ===============================================
    // 検証 3: 監査ログが正しく記録されている
    // ===============================================
    expect(auditLogs.length).toBeGreaterThan(0);

    // action_05_initiated イベントの確認
    const initiatedEvent = auditLogs.find(
      log => log.eventType === 'action_05_initiated'
    );
    expect(initiatedEvent).toBeDefined();
    expect(initiatedEvent?.actor).toBe('ai-agent-tx-5-imp-1');
    expect(initiatedEvent?.outputStatus).toBe('pending');

    // action_05_success イベントの確認
    const successEvent = auditLogs.find(
      log => log.eventType === 'action_05_success'
    );
    expect(successEvent).toBeDefined();
    expect(successEvent?.actor).toBe('ai-agent-tx-5-imp-1');
    expect(successEvent?.outputStatus).toBe('success');

    // 時系列順序の確認
    const initiatedIndex = auditLogs.findIndex(
      log => log.eventType === 'action_05_initiated'
    );
    const successIndex = auditLogs.findIndex(
      log => log.eventType === 'action_05_success'
    );
    expect(initiatedIndex).toBeLessThan(successIndex);

    // ===============================================
    // 検証 4: 全ての AI Client アクション実行の確認
    // ===============================================
    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    expect(mockAiClient.executeAction03).toHaveBeenCalled();
    expect(mockAiClient.executeAction04).toHaveBeenCalled();
    expect(mockAiClient.executeAction05).toHaveBeenCalled();

    // ===============================================
    // 検証 5: ステータス値が正確に記録されている
    // ===============================================
    expect(result.status).toBe('completed');
    expect(result.toolSyncStatus.jira).toBe('synced');
    expect(result.toolSyncStatus.asana).toBe('synced');
    expect(result.escalationCount).toBe(0);
    expect(result.notificationSent).toBe(true);

    // ===============================================
    // 検証 6: recordedAt が ISO8601 形式であること
    // ===============================================
    const isoDateRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    expect(result.recordedAt).toMatch(isoDateRegex);
  });
});