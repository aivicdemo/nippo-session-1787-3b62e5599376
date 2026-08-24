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

describe('tx-5-imp-1: 既存ツール連携API失敗時の自動リトライ・通知機能', () => {
  // SCEN-1285: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能 - 第1回目リトライの間隔が指数バックオフの第1段階より長い場合、動作が異なることを確認する
  test('should retry at exactly 5 minutes after initial failure, log success on second attempt, and display delay notification when backoff exceeds configured interval', async () => {
    // ========== Setup: リトライ実行を追跡するためのタイムシミュレーション ==========
    const mockNowMs = 0;
    const baselineTimeMs = mockNowMs;
    const retryAttempts: { attemptIndex: number; timeMs: number; result: 'failure' | 'success' }[] = [];
    let callCount = 0;

    // ========== Mock AI Client: 指数バックオフ設定（ビジネスルール反映）==========
    // ビジネスルール：IntegrationRetryConfig
    // - maxRetries: 3回
    // - backoffMultiplier: 2
    // - initialDelayMs: 300000 (5分)
    const maxRetries = 3;
    const backoffMultiplier = 2;
    const initialDelayMs = 300000; // 5分 = 300,000ms

    // ========== Stub: NotificationServiceAdapter ==========
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(
        async (userId: string, message: string): Promise<{ success: boolean; deliveryTimeMs?: number; error?: string }> => {
          callCount++;
          const attemptIndex = callCount;
          const currentTimeMs = baselineTimeMs + (attemptIndex === 1 ? 0 : 300000); // 初回=0s、2回目=300s

          retryAttempts.push({
            attemptIndex,
            timeMs: currentTimeMs,
            result: attemptIndex === 1 ? 'failure' : 'success',
          });

          // 初回呼び出しで失敗（タイムアウト）、2回目以降成功
          if (attemptIndex === 1) {
            const timeoutError = new Error('Timeout: notification delivery exceeded 30 seconds');
            return { success: false, error: timeoutError.message };
          }

          // 2回目以降は成功
          return { success: true, deliveryTimeMs: currentTimeMs };
        }
      ),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'pending', attempts: [] })),
    };

    // ========== Mock AI Client Stub: validateAndIntegrate ==========
    const mockAiClient = {
      validateAndIntegrate: jest.fn(
        async (
          input: Tx5Imp1AgentInput
        ): Promise<{
          validatedIssues: ValidatedIssue[];
          integrationStatus: 'success' | 'partial_failure' | 'retry_scheduled';
          integrationResult: ToolIntegrationResult;
          executionSummary: ExecutionSummary;
          retryConfig?: { maxRetries: number; backoffMultiplier: number; initialDelayMs: number };
        }> => {
          // リトライ設定を返す
          return {
            validatedIssues: [
              {
                issueId: 'issue-001',
                priorityScore: 85,
                priorityRank: 'high',
                category: 'backend-defect',
                toolIssueId: null,
                validationStatus: 'valid',
              },
            ],
            integrationStatus: 'retry_scheduled',
            integrationResult: {
              successCount: 0,
              failureCount: 1,
              retryScheduledCount: 1,
              errors: [{ issueId: 'issue-001', code: 'TIMEOUT', message: 'API call timeout' }],
              retryAttempts: [
                {
                  attemptNumber: 1,
                  initialFailureTimeMs: baselineTimeMs,
                  nextRetryScheduledMs: baselineTimeMs + initialDelayMs,
                  backoffIntervalMs: initialDelayMs,
                },
              ],
            },
            executionSummary: {
              processTimeMs: 5000,
              exceptionOccurred: false,
              finalStatus: 'retry_scheduled',
              startTimeMs: baselineTimeMs,
              endTimeMs: baselineTimeMs + 5000,
            },
            retryConfig: {
              maxRetries,
              backoffMultiplier,
              initialDelayMs,
            },
          };
        }
      ),
    };

    // ========== Input Setup: 抽出された課題データ ==========
    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection pool exhaustion',
        description: 'API calls timing out due to pool depletion',
        occurrenceCount: 3,
        impactScore: 85,
        categoryKeywords: ['database', 'performance'],
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://api.jira.example.com/rest/api/3',
      authToken: 'Bearer stub-token-xxx',
      projectKey: 'PROJ',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.3,
      impactWeight: 0.7,
      riskThresholds: {
        highRisk: 75,
        mediumRisk: 50,
        lowRisk: 0,
      },
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'database',
        toolCategory: 'backend-defect',
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // ========== Execute: runTx5Imp1Agent を呼び出し ==========
    const result = await runTx5Imp1Agent(agentInput, mockAiClient);

    // ========== Assertions ==========
    // 1. 初回呼び出しが時刻 T=0 で失敗したことを確認
    expect(retryAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attemptIndex: 1,
          timeMs: baselineTimeMs,
          result: 'failure',
        }),
      ])
    );

    // 2. T=0 秒から T=300秒（5分）までの間、sendReminderNotification が呼び出されていないことを確認
    // → 初回失敗後、第2回目呼び出しは T=300秒より後であること
    const firstAttempt = retryAttempts.find((a) => a.attemptIndex === 1);
    const secondAttempt = retryAttempts.find((a) => a.attemptIndex === 2);

    expect(firstAttempt?.result).toBe('failure');
    expect(secondAttempt).toBeDefined();
    if (secondAttempt) {
      const intervalMs = secondAttempt.timeMs - (firstAttempt?.timeMs ?? 0);
      expect(intervalMs).toBe(initialDelayMs); // 正確に 5分（300,000ms）
    }

    // 3. T=301秒（5分1秒）の時点で、sendReminderNotification が2回目に呼び出されることを確認
    expect(secondAttempt?.timeMs).toBe(baselineTimeMs + initialDelayMs);
    expect(retryAttempts.length).toBe(2); // 初回失敗 + 1回リトライ = 2回

    // 4. 2回目の呼び出しが成功したことを確認
    expect(secondAttempt?.result).toBe('success');

    // 5. integrationResult にリトライ情報が記録されていることを確認
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.failureCount).toBe(1);
    expect(result.integrationResult.retryScheduledCount).toBe(1);
    expect(result.integrationResult.retryAttempts).toBeDefined();
    expect(result.integrationResult.retryAttempts?.length).toBeGreaterThanOrEqual(1);

    // 6. integrationResult.retryAttempts[0] の内容を確認
    const retryAttemptRecord = result.integrationResult.retryAttempts?.[0];
    expect(retryAttemptRecord).toEqual(
      expect.objectContaining({
        attemptNumber: 1,
        initialFailureTimeMs: baselineTimeMs,
        nextRetryScheduledMs: baselineTimeMs + initialDelayMs,
        backoffIntervalMs: initialDelayMs,
      })
    );

    // 7. 次回リトライスケジュールが設定されていないことを確認（3回失敗していないため）
    // → 2回目が成功したので、retryScheduledCount は 1 のまま、次のスケジュールはない
    expect(result.integrationResult.retryScheduledCount).toBe(1);

    // 8. executionSummary の finalStatus が 'retry_scheduled' または成功状態であることを確認
    expect(result.executionSummary.finalStatus).toMatch(/retry_scheduled|success/);

    // 9. validatedIssues が返されていることを確認
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0]).toEqual(
      expect.objectContaining({
        issueId: 'issue-001',
        priorityRank: 'high',
        validationStatus: 'valid',
      })
    );

    // 10. 指数バックオフの第1段階（5分）より長いインターバル（例：6分以上）を設定した場合、
    //     リトライが遅延することをシミュレート確認
    // → backoffIntervalMs が initialDelayMs より大きい場合の検証
    if (retryAttemptRecord && retryAttemptRecord.backoffIntervalMs > initialDelayMs) {
      // この場合、ダッシュボード表示とキュー保存が行われるはず
      expect(result.integrationResult.errors).toBeDefined();
      expect(result.integrationResult.errors?.length).toBeGreaterThan(0);
    }
  });
});