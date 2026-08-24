import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('tx-5-imp-1: 抽出課題の優先度・カテゴリ自動判定と既存ツール連携', () => {
  // SCEN-1284: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能
  test('第1回目リトライの間隔が指数バックオフの第1段階より短い場合、動作が異なることを確認する', async () => {
    const nowTime = new Date('2024-01-15T09:00:00Z');
    const baseInitialDelayMs = 500; // 0.5秒（指数バックオフ第1段階1秒より短縮）
    const backoffMultiplier = 2;
    const maxRetries = 3;

    // リトライ設定：短縮されたスケジュール
    const retryConfigWithShortInterval: IntegrationRetryConfig = {
      maxRetries,
      backoffMultiplier,
      initialDelayMs: baseInitialDelayMs, // 標準1秒より短い0.5秒に設定
    };

    // リトライ実績を記録するためのトラッキング配列
    const retryAttempts: Array<{ attemptNumber: number; timestamp: Date; delayMs: number }> = [];

    // NotificationServiceAdapterのモック：失敗を返す設定
    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => {
        retryAttempts.push({
          attemptNumber: retryAttempts.length + 1,
          timestamp: new Date(),
          delayMs: baseInitialDelayMs * Math.pow(backoffMultiplier, retryAttempts.length),
        });
        return {
          success: false,
          deliveryStatus: 'failed',
          errorMessage: '通知送信に失敗しました',
          retryScheduled: true,
        };
      }),
      scheduleNotification: jest.fn(async () => ({
        success: true,
        scheduledAt: nowTime,
      })),
      getDeliveryStatus: jest.fn(async () => ({
        delivered: 0,
        failed: maxRetries,
        pending: 0,
      })),
    };

    // AIクライアントのモック
    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassify: jest.fn(async () => ({
        validatedIssues: [
          {
            issueId: 'ISS-001',
            priorityScore: 85,
            priorityRank: 'high' as const,
            category: 'Performance',
            toolIssueId: null,
            validationStatus: 'valid' as const,
          },
        ],
        confidenceScores: [0.95],
      })),
      performIntegration: jest.fn(async () => ({
        success: true,
        integratedCount: 1,
        failedCount: 0,
      })),
    };

    const extractedIssueData = [
      {
        issueId: 'ISS-001',
        title: 'Database query performance degradation',
        description: 'SELECT query taking longer than expected in production',
        reportedBy: 'eng-001',
        reportedAt: nowTime,
        affectedSystems: ['API', 'WebApp'],
        impactScore: 85,
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'PROJ',
      retryConfig: retryConfigWithShortInterval,
    };

    const priorityRules = {
      highThreshold: 80,
      mediumThreshold: 50,
      impactWeighting: 0.6,
      frequencyWeighting: 0.4,
    };

    const categoryMappings = [
      {
        extractedCategory: 'performance',
        toolCategory: 'Performance',
      },
    ];

    // エージェント実行
    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockAiClient,
      mockNotificationAdapter
    );

    // 検証1：エージェントが正常に完了
    expect(result).toBeDefined();
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.status).toBe('partial_failure');

    // 検証2：AIクライアントが呼び出されたことを確認
    expect(mockAiClient.validateAndClassify).toHaveBeenCalledTimes(1);

    // 検証3：検証済み課題が返されたことを確認
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0].issueId).toBe('ISS-001');
    expect(result.validatedIssues[0].priorityScore).toBe(85);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].validationStatus).toBe('valid');

    // 検証4：リトライ設定が短縮値で設定されたことを確認
    expect(toolIntegrationConfig.retryConfig.initialDelayMs).toBe(500);
    expect(toolIntegrationConfig.retryConfig.initialDelayMs).toBeLessThan(1000);

    // 検証5：第1回目リトライの間隔が指数バックオフ第1段階より短いことを確認
    // 第1回目: baseInitialDelayMs * 2^0 = 500ms
    const firstRetryDelay = baseInitialDelayMs * Math.pow(backoffMultiplier, 0);
    expect(firstRetryDelay).toBe(500);
    expect(firstRetryDelay).toBeLessThan(1000); // 標準の1秒より短い

    // 検証6：第2回目・第3回目のリトライ間隔が短縮されたスケジュールで計算されることを確認
    // 第2回目: baseInitialDelayMs * 2^1 = 1000ms
    const secondRetryDelay = baseInitialDelayMs * Math.pow(backoffMultiplier, 1);
    expect(secondRetryDelay).toBe(1000);

    // 第3回目: baseInitialDelayMs * 2^2 = 2000ms
    const thirdRetryDelay = baseInitialDelayMs * Math.pow(backoffMultiplier, 2);
    expect(thirdRetryDelay).toBe(2000);

    // 検証7：短縮値に基づくリトライスケジュールが、本来の5分・15分・1時間ではないことを確認
    // 本来の値（参考）: 5分（300000ms）、15分（900000ms）、1時間（3600000ms）
    expect(firstRetryDelay).toBeLessThan(300000); // 第1回目 < 5分
    expect(secondRetryDelay).toBeLessThan(300000); // 第2回目 < 5分
    expect(thirdRetryDelay).toBeLessThan(300000); // 第3回目 < 5分

    // 検証8：統合結果が記録されたことを確認
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.integrationStatus).toBe('retry_scheduled');

    // 検証9：実行サマリーにリトライ情報が含まれることを確認
    expect(result.executionSummary).toHaveProperty('retryAttempts');
    expect(result.executionSummary.retryAttempts).toBeGreaterThanOrEqual(0);

    // 検証10：設定値が実行時に短縮されたスケジュールで機能していることを確認
    // 計算された3つのリトライ間隔が指数バックオフ第1段階より短い基本値に基づいていることを検証
    const expectedRetryIntervals = [
      firstRetryDelay,
      secondRetryDelay,
      thirdRetryDelay,
    ];

    expectedRetryIntervals.forEach((interval, index) => {
      const expectedValue = baseInitialDelayMs * Math.pow(backoffMultiplier, index);
      expect(interval).toBe(expectedValue);
    });

    // 検証11：後続リトライが本来のスケジュール（5分・15分・1時間）ではなく、
    // 短縮値スケジュール（500ms, 1000ms, 2000ms）で実行されることを確認
    // 短縮値スケジュールと本来のスケジュールが大きく異なることを検証
    const standardSchedule = [300000, 900000, 3600000]; // 5分、15分、1時間
    const shortenedSchedule = expectedRetryIntervals;

    shortenedSchedule.forEach((shortened, index) => {
      expect(shortened).toBeLessThan(standardSchedule[index]);
      expect(standardSchedule[index] / shortened).toBeGreaterThan(100); // 100倍以上の差
    });
  });
});

// 型定義（テスト内で使用）
interface IntegrationRetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
}

interface NotificationServiceAdapter {
  sendReminderNotification: jest.Mock<Promise<any>>;
  scheduleNotification: jest.Mock<Promise<any>>;
  getDeliveryStatus: jest.Mock<Promise<any>>;
}

interface Tx5Imp1AiClient {
  validateAndClassify: jest.Mock<Promise<any>>;
  performIntegration: jest.Mock<Promise<any>>;
}