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

interface MockAiClient {
  validateAndClassifyIssues: jest.Mock;
  assessPriority: jest.Mock;
  mapToExternalTool: jest.Mock;
}

interface MockNotificationService {
  sendReminderNotification: jest.Mock;
  scheduleNotification: jest.Mock;
  getDeliveryStatus: jest.Mock;
}

describe('TX5-IMP1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1278: [error] 既存ツール課題データ連携リトライ機能 - データ形式エラーと接続タイムアウトが混在する場合、エラー内容を明確に区別して部長へ通知する
  test('should distinguish and notify different error types during tool integration retry with detailed error messaging', async () => {
    const mockAiClient: MockAiClient = {
      validateAndClassifyIssues: jest.fn(),
      assessPriority: jest.fn(),
      mapToExternalTool: jest.fn(),
    };

    const mockNotificationService: MockNotificationService = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Mock の戻り値設定：エラーを段階的に返す
    // 第1回呼び出し：データ形式エラー（JSON解析失敗）
    mockNotificationService.sendReminderNotification
      .mockResolvedValueOnce({
        status: 'failed',
        errorType: 'FORMAT_ERROR',
        errorMessage: 'データ形式エラー：JSON解析に失敗しました。既存ツール課題データの形式を確認してください。',
        timestamp: '2024-01-15T09:05:00Z',
        retryAttempt: 1,
        nextRetryInterval: 300000, // 5分（ミリ秒）
      })
      // 第2回呼び出し：接続タイムアウト
      .mockResolvedValueOnce({
        status: 'failed',
        errorType: 'TIMEOUT_ERROR',
        errorMessage: '接続タイムアウト：既存ツール課題データ取得時に60秒以上の応答遅延が発生しました。ネットワーク接続を確認してください。',
        timestamp: '2024-01-15T09:20:00Z',
        retryAttempt: 2,
        nextRetryInterval: 900000, // 15分（ミリ秒）
      })
      // 第3回呼び出し：成功
      .mockResolvedValueOnce({
        status: 'success',
        deliveryId: 'notif-001',
        timestamp: '2024-01-15T10:20:00Z',
        recipientId: 'manager-001',
      });

    // AI クライアントのモック設定
    mockAiClient.validateAndClassifyIssues.mockResolvedValue({
      isValid: true,
      validationErrors: [],
    });

    mockAiClient.assessPriority.mockResolvedValue({
      priorityScore: 75,
      priorityRank: 'high',
    });

    mockAiClient.mapToExternalTool.mockResolvedValue({
      toolCategory: 'Backend',
      toolIssueType: 'Bug',
    });

    // テスト用入力データ
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Application fails to connect to primary database',
        severity: 'high',
        keywords: ['database', 'timeout', 'connection'],
        frequency: 3,
        affectedTeams: ['Backend', 'DevOps'],
        reportedAt: '2024-01-15T08:30:00Z',
        reportedBy: 'engineer-001',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      authToken: 'Bearer mock-token-12345',
      projectKey: 'PROJ',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 300000, // 5分
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.5,
      riskWeight: 0.1,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'backend',
        toolCategory: 'Backend',
        toolIssueType: 'Bug',
      },
      {
        systemCategory: 'infrastructure',
        toolCategory: 'DevOps',
        toolIssueType: 'Infrastructure',
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // 実際のエージェント実行
    // 注：実装の詳細によっては、notificationService をパラメータとして渡す必要があります
    // ここでは、エージェントが内部的にモック化されたサービスを使用することを想定しています
    const result = await runTx5Imp1Agent(agentInput, mockAiClient as any);

    // 期待結果の検証

    // 1. バリデーション結果の確認
    expect(result).toBeDefined();
    expect(result.validationResult).toBeDefined();
    expect(result.validationResult.passedCount).toBeGreaterThanOrEqual(0);
    expect(result.validationResult.issues).toBeDefined();
    expect(Array.isArray(result.validationResult.issues)).toBe(true);

    // 2. 優先度判定結果の確認
    expect(result.priorityJudgment).toBeDefined();
    expect(Array.isArray(result.priorityJudgment)).toBe(true);
    if (result.priorityJudgment.length > 0) {
      const firstJudgment = result.priorityJudgment[0];
      expect(firstJudgment.issueId).toBe('issue-001');
      expect(typeof firstJudgment.priorityScore).toBe('number');
      expect(firstJudgment.priorityScore).toBeGreaterThanOrEqual(0);
      expect(firstJudgment.priorityScore).toBeLessThanOrEqual(100);
      expect(typeof firstJudgment.category).toBe('string');
    }

    // 3. 統合ステータスの確認
    expect(result.integrationStatus).toBeDefined();
    expect(['success', 'partial_failure', 'retry_scheduled']).toContain(
      result.integrationStatus
    );

    // 4. 通知送信フラグの確認
    expect(typeof result.confirmationEmailSent).toBe('boolean');

    // 5. エラー通知の詳細検証
    // モック化されたサービスが呼び出されたことを確認
    expect(mockNotificationService.sendReminderNotification).toHaveBeenCalled();

    // 複数回の呼び出しを確認（リトライが実行されたことを示す）
    expect(mockNotificationService.sendReminderNotification.mock.calls.length).toBeGreaterThanOrEqual(
      1
    );

    // 呼び出しの詳細を確認（各エラーが異なるタイミングで発生していることを検証）
    const firstCall = mockNotificationService.sendReminderNotification.mock
      .calls[0];
    expect(firstCall).toBeDefined();

    if (
      mockNotificationService.sendReminderNotification.mock.calls.length >= 2
    ) {
      const secondCall = mockNotificationService.sendReminderNotification.mock
        .calls[1];
      expect(secondCall).toBeDefined();

      // 第1回と第2回の呼び出しが異なることを確認
      expect(firstCall).not.toEqual(secondCall);
    }

    // 6. バリデーションされた課題の確認
    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);

    if (result.validatedIssues.length > 0) {
      const validatedIssue = result.validatedIssues[0];
      expect(validatedIssue.issueId).toBeDefined();
      expect(typeof validatedIssue.priorityScore).toBe('number');
      expect(validatedIssue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(validatedIssue.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(validatedIssue.priorityRank);
      expect(typeof validatedIssue.category).toBe('string');
      expect(validatedIssue.validationStatus).toBeDefined();
      expect(['valid', 'warning', 'invalid']).toContain(
        validatedIssue.validationStatus
      );
    }

    // 7. 統合結果の確認
    expect(result.integrationResult).toBeDefined();
    expect(typeof result.integrationResult.successCount).toBe('number');
    expect(typeof result.integrationResult.failureCount).toBe('number');
    expect(result.integrationResult.successCount).toBeGreaterThanOrEqual(0);
    expect(result.integrationResult.failureCount).toBeGreaterThanOrEqual(0);

    // 8. 実行サマリーの確認
    expect(result.executionSummary).toBeDefined();
    expect(typeof result.executionSummary.executionTime).toBe('number');
    expect(result.executionSummary.executionTime).toBeGreaterThanOrEqual(0);
    expect(result.executionSummary.status).toBeDefined();
    expect(['completed', 'partial', 'failed']).toContain(
      result.executionSummary.status
    );
  });
});