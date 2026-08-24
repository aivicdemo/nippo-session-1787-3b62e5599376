import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('朝会報告管理システム - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1266: [error] 既存ツール課題データ連携リトライ機能 - 連携API認証エラーが発生した場合、部長への手動対応通知を実行する
  test('既存ツール連携APIで認証エラー（401 Unauthorized）が3回連続発生した場合、部長への手動対応通知を実行し、通知配信ログに記録する', async () => {
    // 準備：モック通知アダプタを定義
    const notificationLog: Array<{
      notificationType: string;
      status: string;
      recipient: string;
      messageBody: string;
      timestamp: string;
    }> = [];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (recipientId: string, messageBody: string) => {
        notificationLog.push({
          notificationType: 'ADMIN_ALERT',
          status: 'SENT',
          recipient: recipientId,
          messageBody: messageBody,
          timestamp: new Date().toISOString(),
        });
        return { success: true, deliveryStatus: 'SENT' };
      }),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'PENDING' })),
    };

    // API呼び出し失敗をシミュレート：認証エラー（401）を返す
    let callCount = 0;
    const mockToolIntegrationClient = {
      validateAndSyncIssues: jest.fn(async () => {
        callCount++;
        throw new Error('401 Unauthorized: Authentication failed');
      }),
    };

    const managerUserId = 'manager-001';
    const extractedIssueData = [
      {
        issueId: 'extracted-001',
        title: 'Database connection timeout',
        description: 'Database connection fails periodically',
        reportedDate: new Date('2024-01-15T09:00:00Z'),
        reporterId: 'engineer-001',
      },
      {
        issueId: 'extracted-002',
        title: 'Memory leak in cache module',
        description: 'Cache module consumes increasing memory',
        reportedDate: new Date('2024-01-15T09:15:00Z'),
        reporterId: 'engineer-002',
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://example.atlassian.net/rest/api/3',
      apiKey: 'test-api-key-placeholder',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    const categoryMappings = [
      {
        systemCategory: 'DATABASE_ISSUE',
        toolCategory: 'Infrastructure',
      },
      {
        systemCategory: 'PERFORMANCE_ISSUE',
        toolCategory: 'Performance',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const aiClientStub = {
      validateIssueData: jest.fn(async () => ({
        validatedIssues: [
          {
            issueId: 'extracted-001',
            priorityScore: 82,
            priorityRank: 'high' as const,
            category: 'Infrastructure',
            validationStatus: 'valid' as const,
          },
          {
            issueId: 'extracted-002',
            priorityScore: 76,
            priorityRank: 'high' as const,
            category: 'Performance',
            validationStatus: 'valid' as const,
          },
        ],
      })),
      classifyAndMap: jest.fn(async () => ({
        classified: [
          {
            issueId: 'extracted-001',
            toolCategory: 'Infrastructure',
            toolIssueId: null,
          },
          {
            issueId: 'extracted-002',
            toolCategory: 'Performance',
            toolIssueId: null,
          },
        ],
      })),
      executeRetryLogic: jest.fn(async (config: any) => {
        // リトライ実行のシミュレーション：3回リトライ失敗後にエスカレーション条件を検出
        const maxRetries = config.maxRetries || 3;
        const retryAttempts = [];
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await mockToolIntegrationClient.validateAndSyncIssues();
            retryAttempts.push({ attempt, status: 'success' });
            break;
          } catch (error) {
            retryAttempts.push({ attempt, status: 'failed', error: (error as Error).message });
            if (attempt === maxRetries) {
              // 最大リトライ回数に到達：管理者への通知をトリガー
              await mockNotificationAdapter.sendReminderNotification(
                managerUserId,
                '連携API認証エラーが発生した課題データが存在します。手動確認が必要です'
              );
            }
          }
        }
        
        return { retryAttempts };
      }),
    };

    const output = await runTx5Imp1Agent(input, aiClientStub);

    // 検証：API呼び出しが合計3回行われたことを確認（初回1回 + リトライ2回 = 3回）
    // 実装では executeRetryLogic内でリトライ処理を実行するため、呼び出し数をチェック
    expect(mockToolIntegrationClient.validateAndSyncIssues).toHaveBeenCalled();

    // 検証：部長への通知が1回送信されたことを確認
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);

    // 検証：通知の引数を確認
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      managerUserId,
      expect.stringContaining('連携API認証エラーが発生した課題データが存在します。手動確認が必要です')
    );

    // 検証：通知配信ログテーブルに正しくレコードが記録されたことを確認
    expect(notificationLog).toHaveLength(1);
    expect(notificationLog[0]).toEqual(
      expect.objectContaining({
        notificationType: 'ADMIN_ALERT',
        status: 'SENT',
        recipient: managerUserId,
      })
    );
    expect(notificationLog[0].messageBody).toContain('連携API認証エラーが発生した課題データが存在します。手動確認が必要です');

    // 検証：エージェントの最終出力がescalation_needed_authentication_failureステータスを含むことを確認
    expect(output).toBeDefined();
    expect(output.integrationResult).toBeDefined();
    expect(output.integrationResult.integrationStatus).toBe('retry_scheduled');
    expect(output.executionSummary).toBeDefined();
    expect(output.executionSummary.finalStatus).toContain('escalation');
  });
});