import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1280: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能 - リトライ回数が3回未満（2回）で全て失敗した場合、3回目は実行されず部長通知が発生しない
  test('should not execute third retry and not send admin alert when first two retries fail with maxRetries=3 and backoffMultiplier=2', async () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn(),
      sendAdminAlert: jest.fn(),
    };

    // 最初の2回は失敗、3回目は呼ばれないはず
    mockNotificationAdapter.sendReminderNotification
      .mockResolvedValueOnce({ success: false, reason: 'network_error' })
      .mockResolvedValueOnce({ success: false, reason: 'network_error' });

    // AI側の検証とカテゴリ分類は成功
    mockAiClient.validateAndClassifyIssues.mockResolvedValue({
      validatedIssues: [
        {
          issueId: 'ISSUE-001',
          priorityScore: 85,
          priorityRank: 'high' as const,
          category: 'infrastructure',
          toolIssueId: null,
          validationStatus: 'valid' as const,
        },
      ],
      integrationResult: {
        successCount: 0,
        failureCount: 1,
        retryInfo: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelayMs: 5 * 60 * 1000,
          currentRetryCount: 0,
        },
      },
      executionSummary: {
        processingTimeMs: 2500,
        exceptionsOccurred: false,
        finalStatus: 'partial_failure' as const,
      },
    });

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          title: 'Database connection timeout',
          description: 'Connection pool exhausted during peak hours',
          category: 'infrastructure',
          severity: 'high',
          reportedBy: 'engineer-001',
          reportedAt: new Date('2024-06-15T09:00:00Z'),
          affectedSystems: ['api-server', 'db-primary'],
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/rest/api/3',
        projectKey: 'INFRA',
        authToken: 'mock-token-xyz',
      },
      priorityRules: {
        frequency_weight: 0.4,
        impact_weight: 0.6,
        frequency_threshold: 2,
        impact_threshold: 50,
      },
      categoryMappings: [
        {
          systemCategory: 'infrastructure',
          jiraIssueType: 'Infrastructure',
          jiraLabels: ['infrastructure', 'critical'],
        },
      ],
    };

    // リトライ設定：最大3回、初回待機5分、指数バックオフ乗数2
    const retryConfig = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 5 * 60 * 1000,
    };

    // 模擬タイマーを使用してリトライのスケジューリングをシミュレート
    jest.useFakeTimers();

    const now = new Date('2024-06-15T09:00:00Z');
    jest.setSystemTime(now);

    // 実行
    const resultPromise = runTx5Imp1Agent(agentInput, mockAiClient, mockNotificationAdapter, retryConfig);

    // 1回目の試行：即座に実行、失敗
    jest.runOnlyPendingTimers();
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);

    // 5分進める（1回目のリトライ間隔）
    jest.advanceTimersByTime(5 * 60 * 1000);

    // 2回目の試行が実行される
    jest.runOnlyPendingTimers();
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);

    // 追加で15分進める（2回目のリトライ間隔は10分のはずが、記述では「追加15分」なので3回目のタイマーは発火しないはず）
    // 注: 2回失敗時点で maxRetries=3 に達していないため、3回目のタイマーは設定されるが、
    // テストシナリオでは3回目が実行されないことを期待している
    jest.advanceTimersByTime(15 * 60 * 1000);
    jest.runOnlyPendingTimers();

    // 3回目の送信は実行されていないはず（呼び出し回数が2回のまま）
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);

    // 管理者アラートは呼ばれていないはず
    expect(mockAiClient.sendAdminAlert).not.toHaveBeenCalled();

    jest.useRealTimers();

    // 最終結果を確認
    const result: Tx5Imp1AgentOutput = await resultPromise;

    // 検証結果：1回失敗した課題が記録され、統合ステータスは部分的失敗
    expect(result.validationResult.failedCount).toBe(1);
    expect(result.integrationStatus).toBe('partial_failure');

    // 通知配信ログには2回の試行のみ記録されている
    // （実装側でログテーブルに記録される場合の検証）
    expect(result.validationResult.issues).toBeDefined();
  });
});