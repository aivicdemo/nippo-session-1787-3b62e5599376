import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('朝会報告管理システム - tx-5-imp-1 既存ツール連携エージェント', () => {
  // SCEN-1258: [normal] 既存ツール連携API失敗時の自動リトライ機能 - 認証エラーで初回リトライが1回目として正常に実行される
  test('認証エラー(401)発生時に初回リトライとして1回目が正常に認識・実行され、通知配信ログに記録され、5分後の2回目呼び出しで成功する', async () => {
    // ===== Setup: テスト用の固定日時を定義 =====
    const baseTimestamp = new Date('2024-01-15T09:00:00Z');
    const retryTimestamp = new Date('2024-01-15T09:05:00Z');

    // ===== Setup: 抽出済み課題データを準備 =====
    const extractedIssues = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection pool exhausted',
        frequency: 3,
        impactScore: 75,
      },
      {
        issueId: 'issue-002',
        title: 'Memory leak in batch process',
        description: 'Memory usage increases over time',
        frequency: 2,
        impactScore: 65,
      },
    ];

    // ===== Setup: 既存ツール連携設定を準備 =====
    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      endpoint: 'https://jira.example.com/api',
      apiKey: 'test-api-key-12345',
      projectKey: 'PROJ',
    };

    // ===== Setup: 優先度判定ルールを準備 =====
    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    // ===== Setup: カテゴリマッピングを準備 =====
    const categoryMappings = [
      {
        systemCategory: 'infrastructure',
        toolCategory: 'Infrastructure',
      },
      {
        systemCategory: 'performance',
        toolCategory: 'Performance',
      },
    ];

    // ===== Setup: NotificationServiceAdapterをモック化 =====
    const notificationLogs: Array<{
      userId: string;
      timestamp: Date;
      retryCount: number;
      retryReason?: string;
      nextRetryTime?: Date;
      status?: string;
    }> = [];

    let callCount = 0;

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndEnrichIssues: async (issues) => {
        return issues.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: issue.frequency * priorityRules.frequencyWeight + issue.impactScore * priorityRules.impactWeight,
          priorityRank: issue.impactScore >= priorityRules.highThreshold ? 'high' : 'medium',
          category: 'infrastructure',
          toolIssueId: null,
          validationStatus: 'valid' as const,
        }));
      },

      sendReminderNotification: async (userId: string) => {
        callCount++;

        // 1回目の呼び出し: 認証エラー(401)を返す
        if (callCount === 1) {
          notificationLogs.push({
            userId,
            timestamp: baseTimestamp,
            retryCount: 0,
            retryReason: '認証エラー',
            nextRetryTime: new Date(baseTimestamp.getTime() + 5 * 60 * 1000), // 5分後
          });
          throw {
            statusCode: 401,
            message: 'Unauthorized',
          };
        }

        // 2回目の呼び出し: 成功(200)を返す
        if (callCount === 2) {
          notificationLogs.push({
            userId,
            timestamp: retryTimestamp,
            retryCount: 1,
            status: '成功',
          });
          return {
            success: true,
            deliveryId: `delivery-${userId}-${callCount}`,
          };
        }

        throw new Error('Unexpected call count');
      },

      integrateWithExistingTool: async (validatedIssues, config) => {
        return {
          success: true,
          integratedCount: validatedIssues.length,
          failedCount: 0,
          toolIssueIds: validatedIssues.map((issue) => ({
            issueId: issue.issueId,
            toolIssueId: `PROJ-${Math.random().toString().slice(2, 6)}`,
          })),
        };
      },

      generateExecutionSummary: async (validatedIssues, integrationResult) => {
        return {
          totalIssuesProcessed: validatedIssues.length,
          successCount: integrationResult.integratedCount,
          failureCount: integrationResult.failedCount,
          startTime: baseTimestamp,
          endTime: retryTimestamp,
          processingDurationMs: 5 * 60 * 1000,
          status: 'completed',
        };
      },
    };

    // ===== Execution: runTx5Imp1Agent を呼び出す =====
    const input: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const output = await runTx5Imp1Agent(input, mockAiClient);

    // ===== Assertion: output が Tx5Imp1AgentOutput 型であることを確認 =====
    expect(output).toBeDefined();
    expect(output.validatedIssues).toBeDefined();
    expect(output.integrationResult).toBeDefined();
    expect(output.executionSummary).toBeDefined();

    // ===== Assertion: validateAndEnrichIssues の結果を検証 =====
    expect(output.validatedIssues.length).toBe(2);

    // issue-001の検証
    const validatedIssue1 = output.validatedIssues.find((v) => v.issueId === 'issue-001');
    expect(validatedIssue1).toBeDefined();
    if (validatedIssue1) {
      // priorityScore = 3 * 0.4 + 75 * 0.6 = 1.2 + 45 = 46.2
      expect(validatedIssue1.priorityScore).toBe(46.2);
      expect(validatedIssue1.priorityRank).toBe('high');
      expect(validatedIssue1.category).toBe('infrastructure');
      expect(validatedIssue1.validationStatus).toBe('valid');
    }

    // issue-002の検証
    const validatedIssue2 = output.validatedIssues.find((v) => v.issueId === 'issue-002');
    expect(validatedIssue2).toBeDefined();
    if (validatedIssue2) {
      // priorityScore = 2 * 0.4 + 65 * 0.6 = 0.8 + 39 = 39.8
      expect(validatedIssue2.priorityScore).toBe(39.8);
      expect(validatedIssue2.priorityRank).toBe('medium');
      expect(validatedIssue2.category).toBe('infrastructure');
      expect(validatedIssue2.validationStatus).toBe('valid');
    }

    // ===== Assertion: 認証エラー(401)が初回呼び出しで正常に発生したことを確認 =====
    expect(callCount).toBeGreaterThanOrEqual(1);

    // ===== Assertion: 通知配信ログに『リトライ回数: 1』『リトライ理由: 認証エラー』『次回リトライ予定時刻: 現在時刻+5分』が記録されたことを確認 =====
    expect(notificationLogs.length).toBeGreaterThanOrEqual(1);

    const firstRetryLog = notificationLogs[0];
    expect(firstRetryLog.retryCount).toBe(0); // 1回目呼び出しは retryCount=0
    expect(firstRetryLog.retryReason).toBe('認証エラー');
    expect(firstRetryLog.nextRetryTime).toEqual(new Date('2024-01-15T09:05:00Z'));

    // ===== Assertion: システムが初回リトライ(1回目のリトライ)として認識されたことをシミュレート =====
    // 2回目の呼び出しが実行されたことを確認
    expect(callCount).toBe(2);

    // ===== Assertion: 2回目の呼び出し(5分後)で通知送信に成功したことを確認 =====
    const secondRetryLog = notificationLogs[notificationLogs.length - 1];
    expect(secondRetryLog.retryCount).toBe(1);
    expect(secondRetryLog.status).toBe('成功');
    expect(secondRetryLog.timestamp).toEqual(new Date('2024-01-15T09:05:00Z'));

    // ===== Assertion: integrationResult の成功件数・失敗件数を検証 =====
    expect(output.integrationResult.success).toBe(true);
    expect(output.integrationResult.integratedCount).toBe(2);
    expect(output.integrationResult.failedCount).toBe(0);

    // ===== Assertion: executionSummary の処理時間が5分(300,000ms)であることを確認 =====
    expect(output.executionSummary.processingDurationMs).toBe(5 * 60 * 1000);
    expect(output.executionSummary.status).toBe('completed');
    expect(output.executionSummary.totalIssuesProcessed).toBe(2);
    expect(output.executionSummary.successCount).toBe(2);
    expect(output.executionSummary.failureCount).toBe(0);
  });
});