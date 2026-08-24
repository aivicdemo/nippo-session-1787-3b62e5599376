import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
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

describe('tx-5-imp-1: 抽出済み課題データの自動検証・優先度判定・既存ツール連携', () => {
  // SCEN-1219: [error] 既存ツール連携機能 - 連携先ツールの認証情報が null のとき処理が中断される

  test('SCEN-1219: 認証情報が null のときエラーを返し処理が中断される', async () => {
    // === 前提条件 ===
    // テスト環境で NotificationServiceAdapter のスタブを初期化し、認証情報を null に設定

    const mockToolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      endpoint: 'https://jira.example.com/api',
      authCredentials: null, // ← 認証情報を null に設定
      projectId: 'PROJ123',
    };

    const mockExtractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        content: 'Database connection timeout in production',
        extractedAt: new Date('2026-01-15T09:00:00Z'),
        sourceReportId: 'report-001',
        confidenceScore: 0.95,
      },
      {
        issueId: 'issue-002',
        content: 'API response time degradation',
        extractedAt: new Date('2026-01-15T09:05:00Z'),
        sourceReportId: 'report-002',
        confidenceScore: 0.87,
      },
    ];

    const mockPriorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      frequencyThreshold: 2,
      highScoreThreshold: 75,
      mediumScoreThreshold: 50,
    };

    const mockCategoryMappings: CategoryMapping[] = [
      {
        sourceCategory: 'Infrastructure',
        targetCategory: 'Operations',
        toolSpecificTag: 'ops',
      },
      {
        sourceCategory: 'Performance',
        targetCategory: 'Performance',
        toolSpecificTag: 'perf',
      },
    ];

    // === スタブの NotificationServiceAdapter を定義 ===
    const stubToolIntegrationAdapter = {
      validateCredentials: async () => {
        if (mockToolIntegrationConfig.authCredentials === null) {
          return {
            isValid: false,
            error: 'Authentication credentials not provided',
          };
        }
        return { isValid: true };
      },
      authenticateAndConnect: async () => {
        if (mockToolIntegrationConfig.authCredentials === null) {
          throw new Error('Authentication credentials not provided');
        }
        return { connected: true };
      },
      createIssue: async () => {
        throw new Error('Authentication credentials not provided');
      },
      updateIssue: async () => {
        throw new Error('Authentication credentials not provided');
      },
      getIssueStatus: async () => {
        throw new Error('Authentication credentials not provided');
      },
    };

    const stubNotificationServiceAdapter = {
      sendReminderNotification: async () => {
        return {
          success: false,
          error: 'Authentication credentials not provided',
          deliveryId: null,
        };
      },
      scheduleNotification: async () => {
        return {
          success: false,
          error: 'Authentication credentials not provided',
        };
      },
      getDeliveryStatus: async () => {
        return { status: 'failed', reason: 'Not authenticated' };
      },
    };

    const mockAiClient = {
      validateIssueData: async () => ({
        passedCount: 2,
        failedCount: 0,
        issues: [
          {
            issueId: 'issue-001',
            validationStatus: 'valid' as const,
            reason: 'Data format is valid',
          },
          {
            issueId: 'issue-002',
            validationStatus: 'valid' as const,
            reason: 'Data format is valid',
          },
        ],
      }),
      judgeIssueCategory: async () => [
        {
          issueId: 'issue-001',
          category: 'Operations',
          confidence: 0.92,
        },
        {
          issueId: 'issue-002',
          category: 'Performance',
          confidence: 0.88,
        },
      ],
      calculatePriorityScore: async () => [
        {
          issueId: 'issue-001',
          priorityScore: 82,
          priorityRank: 'high' as const,
        },
        {
          issueId: 'issue-002',
          priorityScore: 71,
          priorityRank: 'medium' as const,
        },
      ],
      prepareToolIntegrationPayload: async () => [
        {
          issueId: 'issue-001',
          toolIssueTitle: 'Database connection timeout in production',
          toolIssueDescription: 'Connection pooling exhausted',
          toolIssuePriority: 'High',
          toolIssueCategory: 'ops',
        },
        {
          issueId: 'issue-002',
          toolIssueTitle: 'API response time degradation',
          toolIssueDescription: 'Latency increased from 100ms to 500ms',
          toolIssuePriority: 'Medium',
          toolIssueCategory: 'perf',
        },
      ],
      executeToolIntegration: async () => ({
        success: false,
        failedIssues: [
          {
            issueId: 'issue-001',
            failureReason: 'Authentication credentials not provided',
          },
          {
            issueId: 'issue-002',
            failureReason: 'Authentication credentials not provided',
          },
        ],
        retryableFailures: 0,
        permanentFailures: 2,
      }),
    };

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: mockExtractedIssues,
      toolIntegrationConfig: mockToolIntegrationConfig,
      priorityRules: mockPriorityRules,
      categoryMappings: mockCategoryMappings,
    };

    // === 実行 ===
    const result = await runTx5Imp1Agent(agentInput, mockAiClient);

    // === 検証 ===
    // 1. integrationResult.success が false であること
    expect(result.integrationResult.success).toBe(false);

    // 2. integrationResult に error フィールドが存在し、認証情報不足を示していること
    expect(result.integrationResult.error).toBeDefined();
    expect(result.integrationResult.error).toMatch(/[Aa]uthentication/);

    // 3. integrationResult.failedIssueCount が全課題数と一致すること（全て失敗）
    expect(result.integrationResult.failedIssueCount).toBe(2);
    expect(result.integrationResult.successCount).toBe(0);

    // 4. toolIssueId が null のまま（連携未完了）
    result.validatedIssues.forEach((issue) => {
      expect(issue.toolIssueId).toBeNull();
    });

    // 5. executionSummary.finalStatus が 'failure' または 'partial_failure'
    expect(result.executionSummary.finalStatus).toMatch(
      /failure|partial_failure/
    );

    // 6. executionSummary に例外情報が記録されていること
    expect(result.executionSummary.exceptionRaised).toBe(true);
    expect(result.executionSummary.exceptionMessage).toMatch(
      /[Aa]uthentication/
    );

    // 7. 処理がスケジュール登録フェーズに到達していないこと（scheduleNotification が呼ばれていない）
    // → executionSummary.failurePhase が 'integration_authentication' であることで確認
    expect(result.executionSummary.failurePhase).toBe(
      'integration_authentication'
    );

    // 8. retryInfo が存在し、リトライが試行されなかった（maxRetries に達していない）ことを示す
    expect(result.integrationResult.retryInfo).toBeDefined();
    expect(result.integrationResult.retryInfo?.retriesAttempted).toBe(0);
  });
});