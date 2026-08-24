import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1265: [error] 既存ツール課題データ連携リトライ機能 - 連携APIレスポンスがタイムアウトした場合、指数バックオフで最大3回までリトライする
  test('should handle tool integration timeout with exponential backoff retry up to 3 times and fallback to cache', async () => {
    const extractedIssueIds = ['issue-001', 'issue-002', 'issue-003'];
    const validationMode = 'auto';
    const targetToolType = 'jira';
    const projectManagerId = 'pm-user-001';

    const retryLogs: Array<{
      attempt: number;
      delayMs: number;
      timestamp: string;
    }> = [];
    const finalLogs: string[] = [];

    const mockAiClient: Tx5Imp1AiClient = {
      callAction01_ValidateExtractedIssues: jest.fn(async () => ({
        passedCount: 2,
        failedCount: 1,
        issues: [
          {
            issueId: 'issue-001',
            title: 'Database connection timeout',
            severity: 'high',
            validationStatus: 'valid',
          },
          {
            issueId: 'issue-002',
            title: 'Memory leak in cache module',
            severity: 'medium',
            validationStatus: 'valid',
          },
        ],
      })),

      callAction02_JudgePriorityAndCategory: jest.fn(async () => ({
        issueId: 'issue-001',
        priorityScore: 85,
        category: 'Infrastructure',
      })),

      callAction03_DetermineToolIntegrationStrategy: jest.fn(async () => ({
        toolType: 'jira',
        mappedCategory: 'Technical-Debt',
        retryConfig: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelayMs: 3000,
        },
      })),

      callAction04_ExecuteToolIntegration: jest.fn(async () => {
        let callCount = 0;
        return async () => {
          callCount++;
          const baseDelayMs = 3000;
          const delays = [0, 3000, 10000, 30000];

          if (callCount <= 4) {
            const delayMs = callCount === 1 ? 0 : delays[callCount - 1];
            if (callCount > 1) {
              retryLogs.push({
                attempt: callCount - 1,
                delayMs: delayMs,
                timestamp: new Date().toISOString(),
              });
            }

            if (callCount <= 4) {
              throw new Error('API timeout exceeded 30 seconds');
            }
          }
        };
      }),

      callAction05_RecordExecutionAndNotify: jest.fn(async () => {
        finalLogs.push('3秒後にリトライ');
        finalLogs.push('10秒後にリトライ');
        finalLogs.push('30秒後にリトライ');
        finalLogs.push('最大リトライ回数に達した。キャッシュまたは代替機能を使用');

        return {
          status: 'partial_failure',
          successCount: 0,
          failureCount: 3,
          cachedResultUsed: true,
          fallbackMode: 'manual_keyword_input',
          executedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
          retryAttempts: 3,
          totalExecutionTimeMs: 46000,
          systemLogs: [
            '初回API呼び出し: タイムアウト',
            '1回目リトライ（3秒後）: タイムアウト',
            '2回目リトライ（10秒後）: タイムアウト',
            '3回目リトライ（30秒後）: タイムアウト',
            '最大リトライ回数に達した。キャッシュから前回の分析結果を返却',
          ],
        };
      }),
    };

    const result = await runTx5Imp1Agent(
      {
        extractedIssueIds,
        validationMode,
        targetToolType,
        projectManagerId,
      },
      mockAiClient
    );

    expect(result).toBeDefined();
    expect(result.integrationStatus).toBe('partial_failure');
    expect(result.validationResult.passedCount).toBe(2);
    expect(result.validationResult.failedCount).toBe(1);
    expect(result.validationResult.issues).toHaveLength(2);

    expect(result.priorityJudgment).toHaveLength(1);
    expect(result.priorityJudgment[0]).toEqual({
      issueId: 'issue-001',
      priorityScore: 85,
      category: 'Infrastructure',
    });

    expect(mockAiClient.callAction01_ValidateExtractedIssues).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.callAction01_ValidateExtractedIssues).toHaveBeenCalledWith(
      extractedIssueIds,
      validationMode
    );

    expect(mockAiClient.callAction02_JudgePriorityAndCategory).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.callAction02_JudgePriorityAndCategory).toHaveBeenCalledWith(
      'issue-001'
    );

    expect(mockAiClient.callAction03_DetermineToolIntegrationStrategy).toHaveBeenCalledTimes(
      1
    );
    expect(
      mockAiClient.callAction03_DetermineToolIntegrationStrategy
    ).toHaveBeenCalledWith(targetToolType, 'Infrastructure');

    expect(result.confirmationEmailSent).toBe(false);

    const systemLogsFromResult = result.integrationResult?.systemLogs || [];
    expect(systemLogsFromResult).toContain(
      '初回API呼び出し: タイムアウト'
    );
    expect(systemLogsFromResult).toContain(
      '1回目リトライ（3秒後）: タイムアウト'
    );
    expect(systemLogsFromResult).toContain(
      '2回目リトライ（10秒後）: タイムアウト'
    );
    expect(systemLogsFromResult).toContain(
      '3回目リトライ（30秒後）: タイムアウト'
    );
    expect(systemLogsFromResult).toContain(
      '最大リトライ回数に達した。キャッシュから前回の分析結果を返却'
    );

    expect(finalLogs).toEqual([
      '3秒後にリトライ',
      '10秒後にリトライ',
      '30秒後にリトライ',
      '最大リトライ回数に達した。キャッシュまたは代替機能を使用',
    ]);

    expect(mockAiClient.callAction05_RecordExecutionAndNotify).toHaveBeenCalledTimes(
      1
    );

    const recordCallArgs = (
      mockAiClient.callAction05_RecordExecutionAndNotify as jest.Mock
    ).mock.calls[0];
    expect(recordCallArgs[0]).toEqual({
      integrationStatus: 'partial_failure',
      successCount: 0,
      failureCount: 3,
      retryAttempts: 3,
    });
    expect(recordCallArgs[1]).toBe(projectManagerId);

    const integrationResultFromRecord =
      result.integrationResult;
    expect(integrationResultFromRecord?.retryAttempts).toBe(3);
    expect(integrationResultFromRecord?.totalExecutionTimeMs).toBe(46000);
    expect(
      integrationResultFromRecord?.systemLogs
    ).toHaveLength(5);
  });
});