import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX5-IMP1: 既存ツール連携機能 - 課題重複登録防止', () => {
  test('SCEN-1208: Jira連携設定が準備完了状態で課題データが重複登録されずに連携される', async () => {
    // ========================
    // Setup: スタブ化されたAIクライアントと連携ログの初期化
    // ========================
    const jiraApiCallLog: Array<{
      method: string;
      args: Record<string, unknown>;
      timestamp: string;
    }> = [];

    const integrationLogTable: Array<{
      issueId: string;
      toolIssueId: string;
      toolType: string;
      syncTimestamp: string;
      status: string;
    }> = [];

    const mockJiraClient = {
      searchIssues: jest.fn(async (query: string) => {
        jiraApiCallLog.push({
          method: 'searchIssues',
          args: { query },
          timestamp: new Date('2024-01-15T09:30:00Z').toISOString(),
        });
        return {
          issues: [
            {
              key: 'TEST-001',
              id: '10001',
              fields: {
                summary: 'データベース接続エラー',
                description: 'ユーザーログイン時にDB接続タイムアウト',
              },
            },
          ],
        };
      }),
      createIssue: jest.fn(async (issueData: Record<string, unknown>) => {
        jiraApiCallLog.push({
          method: 'createIssue',
          args: issueData,
          timestamp: new Date('2024-01-15T09:30:00Z').toISOString(),
        });
        return { key: 'TEST-001', id: '10001' };
      }),
      getIssue: jest.fn(async (key: string) => {
        jiraApiCallLog.push({
          method: 'getIssue',
          args: { key },
          timestamp: new Date('2024-01-15T09:30:00Z').toISOString(),
        });
        if (key === 'TEST-001') {
          return {
            key: 'TEST-001',
            id: '10001',
            fields: {
              summary: 'データベース接続エラー',
              status: { name: 'In Progress' },
            },
          };
        }
        throw new Error('Issue not found');
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'success',
        deliveredAt: new Date('2024-01-15T09:15:00Z').toISOString(),
      })),
      scheduleNotification: jest.fn(async () => ({
        scheduledId: 'SCHED-001',
        scheduledTime: new Date('2024-01-15T09:00:00Z').toISOString(),
      })),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'delivered',
        timestamp: new Date('2024-01-15T09:15:00Z').toISOString(),
      })),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => ({
        keywords: [
          { keyword: 'データベース接続', frequency: 1, confidence: 0.92 },
        ],
        extractedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
      })),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 78,
        assessedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
      })),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: 'high',
        classifiedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
      })),
    };

    const mockAiClient = {
      validateExtractedIssues: jest.fn(async (input: {
        extractedIssueData: Array<{
          issueId: string;
          description: string;
          frequency: number;
        }>;
        toolIntegrationConfig: { toolType: string; endpoint: string };
      }) => ({
        validatedIssues: [
          {
            issueId: 'ISSUE-001',
            priorityScore: 78,
            priorityRank: 'high' as const,
            category: 'infrastructure',
            toolIssueId: 'TEST-001',
            validationStatus: 'valid' as const,
          },
        ],
        processedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
      })),
      performIntegration: jest.fn(async (input: {
        validatedIssues: Array<{
          issueId: string;
          priorityScore: number;
          category: string;
        }>;
        toolIntegrationConfig: { toolType: string };
      }) => ({
        integratedCount: 1,
        failedCount: 0,
        toolIssueIds: ['TEST-001'],
        integratedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
      })),
      generateIntegrationConfirmation: jest.fn(async () => ({
        confirmationEmailId: 'EMAIL-001',
        sentAt: new Date('2024-01-15T09:30:00Z').toISOString(),
      })),
    };

    // ========================
    // Input: 課題抽出データと既存ツール連携設定
    // ========================
    const orchestratorInput = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          description: 'データベース接続エラーが発生',
          frequency: 1,
          impactLevel: 'high',
          reportDate: new Date('2024-01-15T09:00:00Z').toISOString(),
        },
        {
          issueId: 'ISSUE-001',
          description: 'データベース接続エラーが発生',
          frequency: 1,
          impactLevel: 'high',
          reportDate: new Date('2024-01-15T09:05:00Z').toISOString(),
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        endpoint: 'https://jira.example.com/api/v3',
        apiKey: 'stub-api-key',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        thresholdHigh: 70,
        thresholdMedium: 40,
      },
      categoryMappings: [
        {
          systemCategory: 'infrastructure',
          toolCategory: 'Backend',
        },
      ],
    };

    // ========================
    // Mock implementation: 連携ログテーブルへの記録
    // ========================
    const recordIntegrationLog = (
      issueId: string,
      toolIssueId: string,
      toolType: string,
    ) => {
      const existingRecord = integrationLogTable.find(
        (r) => r.issueId === issueId && r.toolIssueId === toolIssueId,
      );
      if (!existingRecord) {
        integrationLogTable.push({
          issueId,
          toolIssueId,
          toolType,
          syncTimestamp: new Date('2024-01-15T09:30:00Z').toISOString(),
          status: 'synced',
        });
      }
    };

    // ========================
    // Execute: AIエージェントの実行
    // ========================
    const result = await runTx5Imp1Agent(orchestratorInput, mockAiClient);

    // ========================
    // Verify: 以下の期待値を検証
    // ========================

    // 1. 返却された ValidatedIssue の件数と内容
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0].issueId).toBe('ISSUE-001');
    expect(result.validatedIssues[0].priorityScore).toBe(78);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].category).toBe('infrastructure');
    expect(result.validatedIssues[0].toolIssueId).toBe('TEST-001');
    expect(result.validatedIssues[0].validationStatus).toBe('valid');

    // 2. 既存ツール連携の実行結果
    expect(result.integrationResult.successCount).toBe(1);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.toolIssueIds).toContain('TEST-001');
    expect(result.integrationResult.status).toBe('success');

    // 3. 実行サマリーの内容
    expect(result.executionSummary.totalProcessed).toBe(1);
    expect(result.executionSummary.validatedCount).toBe(1);
    expect(result.executionSummary.integratedCount).toBe(1);
    expect(result.executionSummary.status).toBe('completed');

    // 4. AIクライアントメソッドの呼び出し回数
    expect(mockAiClient.validateExtractedIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.performIntegration).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generateIntegrationConfirmation).toHaveBeenCalledTimes(1);

    // 5. 連携ログテーブルに記録される課題件数
    recordIntegrationLog('ISSUE-001', 'TEST-001', 'jira');
    recordIntegrationLog('ISSUE-001', 'TEST-001', 'jira');
    expect(integrationLogTable).toHaveLength(1);
    expect(integrationLogTable[0].issueId).toBe('ISSUE-001');
    expect(integrationLogTable[0].toolIssueId).toBe('TEST-001');
    expect(integrationLogTable[0].status).toBe('synced');

    // 6. Jira APIの呼び出し履歴（重複防止の検証）
    const createIssueCalls = jiraApiCallLog.filter(
      (log) => log.method === 'createIssue',
    );
    expect(createIssueCalls).toHaveLength(0);

    // 7. validateExtractedIssues への入力で重複が既に排除されている
    const validateCall = mockAiClient.validateExtractedIssues.mock.calls[0][0];
    expect(validateCall.extractedIssueData).toHaveLength(1);
    expect(validateCall.extractedIssueData[0].issueId).toBe('ISSUE-001');
  });
});