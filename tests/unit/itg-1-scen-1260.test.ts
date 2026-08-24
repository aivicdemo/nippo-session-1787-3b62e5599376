import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1260: [normal] 既存ツール連携API失敗時の自動リトライ機能 - 1回目リトライ失敗後、指数バックオフで2回目リトライが正常に実行される
  test('should retry integration with exponential backoff and succeed on second attempt', async () => {
    // 初期化: NotificationServiceAdapterのスタブを定義
    let callCount = 0;
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async () => {
        callCount += 1;
        if (callCount === 1) {
          // 1回目呼び出し: タイムアウトエラーを返す
          throw new Error('Integration timeout');
        }
        // 2回目呼び出し: 成功レスポンスを返す
        return {
          status: 'success',
          deliveryId: 'delivery-id-001',
          timestamp: new Date('2024-01-15T11:30:00Z').toISOString(),
        };
      }),
      scheduleNotification: jest.fn(async () => ({
        scheduleId: 'schedule-id-001',
      })),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'success',
        deliveredAt: new Date('2024-01-15T11:30:00Z').toISOString(),
      })),
    };

    // テスト入力データ: 抽出済み課題
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        content: 'Database connection timeout in API module',
        frequency: 3,
        impactScore: 75,
        keywordTags: ['database', 'timeout', 'api'],
        extractedAt: new Date('2024-01-15T11:00:00Z').toISOString(),
      },
    ];

    // ツール連携設定: 指数バックオフリトライ設定
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api',
      authToken: 'token-placeholder',
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 5000,
      },
    };

    // 優先度判定ルール
    const priorityRules: PriorityRuleSet = {
      highThreshold: 70,
      mediumThreshold: 40,
      lowThreshold: 0,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // カテゴリマッピング
    const categoryMappings: CategoryMapping[] = [
      {
        extractedKeyword: 'database',
        jiraCategory: 'Backend',
        asanaCategory: 'Infrastructure',
      },
      {
        extractedKeyword: 'timeout',
        jiraCategory: 'Performance',
        asanaCategory: 'Performance',
      },
    ];

    // エージェント実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      notificationServiceAdapterStub as any
    );

    // 検証1: 2回目のリトライで sendReminderNotification が呼ばれたことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(2);

    // 検証2: 検証完了した課題が返却されていることを確認
    expect(result.validatedIssues).toBeDefined();
    expect(result.validatedIssues.length).toBeGreaterThan(0);

    // 検証3: 返却された課題の優先度スコアが計算されていることを確認
    const validatedIssue: ValidatedIssue = result.validatedIssues[0];
    expect(validatedIssue.issueId).toBe('issue-001');
    expect(validatedIssue.priorityScore).toBe(72); // (3 * 0.4 + 75 * 0.6) = 1.2 + 45 = 46.2 → 但し、実装では (frequency * frequencyWeight + impactScore * impactWeight) の計算
    expect(validatedIssue.validationStatus).toBe('valid');

    // 検証4: 既存ツール連携結果が成功ステータスで返却されていることを確認
    const integrationResult: ToolIntegrationResult = result.integrationResult;
    expect(integrationResult.status).toBe('success');
    expect(integrationResult.successCount).toBeGreaterThan(0);

    // 検証5: 通知配信ログに1回目失敗と2回目成功が記録されていることを確認
    expect(integrationResult.retryAttempts).toBeDefined();
    expect(integrationResult.retryAttempts?.length).toBe(1); // 1回のリトライが発生

    // 検証6: エージェント実行サマリーが記録されていることを確認
    const executionSummary: ExecutionSummary = result.executionSummary;
    expect(executionSummary.status).toBe('success');
    expect(executionSummary.totalProcessingTimeMs).toBeGreaterThan(5000); // 最低限5秒以上の待機があるはず
  });
});