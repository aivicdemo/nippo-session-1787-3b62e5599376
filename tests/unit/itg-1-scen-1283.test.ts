import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 agent: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1283: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能 - 第2回目リトライと第3回目リトライの間隔がちょうど指数バックオフの第2段階
  test('SCEN-1283: 自動リトライロジックが5分・15分・1時間のインターバルで最大3回再試行し、2回目と3回目リトライの間隔が15分（900秒）である', async () => {
    jest.useFakeTimers();

    const retryTimestamps: number[] = [];

    // NotificationServiceAdapterのスタブを準備
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async () => {
        const currentTime = Date.now();
        retryTimestamps.push(currentTime);

        if (retryTimestamps.length === 1 || retryTimestamps.length === 2) {
          // 1回目と2回目は失敗（タイムアウト）
          throw new Error('timeout');
        }
        // 3回目は成功
        return {
          deliveryStatus: 'success',
          sentAt: new Date().toISOString(),
          recipients: ['user1', 'user2'],
        };
      }),
      scheduleNotification: jest.fn(async () => ({
        scheduledId: 'sched-001',
        nextExecutionTime: new Date().toISOString(),
      })),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'success',
        sentCount: 1,
        failedCount: 0,
      })),
    };

    // TextAnalysisServiceAdapterのスタブ
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(async () => ({
        keywords: ['API障害', 'パフォーマンス低下'],
        frequencyScores: [0.85, 0.72],
      })),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 78,
        affectedTeams: 3,
      })),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: 'high',
        confidence: 0.92,
      })),
    };

    const testInput = {
      extractedIssueData: [
        {
          issueId: 'EXT-001',
          content: 'データベース接続エラーが発生',
          reportedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
          reportedBy: 'ENG-001',
        },
        {
          issueId: 'EXT-002',
          content: 'APIレスポンスタイムアウト',
          reportedAt: new Date('2024-01-15T09:05:00Z').toISOString(),
          reportedBy: 'ENG-002',
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira',
        apiEndpoint: 'https://jira.example.com/rest/api/3',
        projectKey: 'PROJ',
        authToken: 'token-xxx',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        thresholds: {
          highPriority: 70,
          mediumPriority: 50,
          lowPriority: 0,
        },
      },
      categoryMappings: [
        {
          extractedCategory: 'infrastructure',
          toolCategory: 'Infrastructure',
          toolCategoryId: 'CAT-INF',
        },
      ],
    };

    const integrationRetryConfig = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 5 * 60 * 1000, // 5分
    };

    // 初回呼び出しを開始
    const agentPromise = runTx5Imp1Agent(testInput, notificationServiceAdapterStub, {
      ...integrationRetryConfig,
    });

    // 1回目の失敗後、5分経過をシミュレート
    jest.advanceTimersByTime(5 * 60 * 1000);
    jest.runOnlyPendingTimers();

    // 現在時刻からさらに10分経過（合計15分）をシミュレート
    jest.advanceTimersByTime(10 * 60 * 1000);
    jest.runOnlyPendingTimers();

    // 残りのタイマーを実行して3回目リトライを完了させる
    jest.advanceTimersByTime(60 * 60 * 1000); // 1時間経過
    jest.runOnlyPendingTimers();

    // エージェント実行の完了を待つ
    const result = await agentPromise;

    jest.useRealTimers();

    // リトライが3回実行されたことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(3);

    // リトライタイムスタンプの記録があることを確認
    expect(retryTimestamps.length).toBe(3);

    // 2回目と3回目リトライの間隔を計算
    const retryTwoTime = retryTimestamps[1];
    const retryThreeTime = retryTimestamps[2];
    const intervalBetweenRetryTwoAndThree = retryThreeTime - retryTwoTime;

    // 仕様書の『5分・15分・1時間』に基づいて、2回目と3回目の間隔が15分（900秒）であることを検証
    // 1回目: T + 0分（初回試行）
    // 2回目: T + 5分（初回試行から5分後）
    // 3回目: T + 5分 + 15分 = T + 20分（2回目から15分後）
    expect(intervalBetweenRetryTwoAndThree).toBe(15 * 60 * 1000);

    // 最終的にエージェントが成功結果を返すことを確認
    expect(result.integrationStatus).toBe('success');
    expect(result.validatedIssues.length).toBeGreaterThan(0);
    expect(result.executionSummary.finalStatus).toBe('completed');
  });
});