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
  Tx5Imp1AiClient,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-3146
  test('[normal] should complete end-to-end issue validation and tool integration without manual approval for 3 normal cases', async () => {
    // Setup: 3件の通常案件データを準備
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection pool exhausted during peak load',
        severity: 'high',
        category: 'Infrastructure',
        reportedBy: 'engineer-001',
        reportedAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        issueId: 'issue-002',
        title: 'API response delay',
        description: 'API gateway returns 504 occasionally',
        severity: 'medium',
        category: 'Performance',
        reportedBy: 'engineer-002',
        reportedAt: new Date('2024-01-15T09:15:00Z'),
      },
      {
        issueId: 'issue-003',
        title: 'Test data cleanup needed',
        description: 'Staging environment accumulating stale test records',
        severity: 'low',
        category: 'Operations',
        reportedBy: 'engineer-003',
        reportedAt: new Date('2024-01-15T09:30:00Z'),
      },
    ];

    // Setup: 既存ツール連携設定
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      projectKey: 'TEAM',
      apiEndpoint: 'https://jira.example.com/api',
      credentials: {
        username: 'bot-user',
        apiToken: 'fake-token-for-testing',
      },
    };

    // Setup: 優先度判定ルール
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    // Setup: カテゴリマッピング
    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'Infrastructure',
        toolCategory: 'Infrastructure',
        toolLabel: 'INF',
      },
      {
        systemCategory: 'Performance',
        toolCategory: 'Performance',
        toolLabel: 'PERF',
      },
      {
        systemCategory: 'Operations',
        toolCategory: 'Operations',
        toolLabel: 'OPS',
      },
    ];

    // Setup: Agent入力オブジェクト
    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Track call history for verification
    const actionCallHistory: string[] = [];
    const toolIntegrationCalls: Array<{
      issueId: string;
      status: string;
    }> = [];
    const notificationCalls: Array<{ message: string }> = [];

    // Setup: TextAnalysisServiceAdapterをスタブ化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'database',
            frequency: 3,
            confidence: 0.95,
          },
          {
            keyword: 'timeout',
            frequency: 2,
            confidence: 0.88,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 85,
        affectedSystems: ['api-gateway', 'database-cluster'],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        confidenceScore: 0.92,
      }),
    };

    // Setup: 既存ツール連携APIをスタブ化
    const mockToolIntegrationAdapter = {
      registerIssue: jest.fn(async (issueData: ValidatedIssue) => {
        toolIntegrationCalls.push({
          issueId: issueData.issueId,
          status: 'registered',
        });
        return {
          toolIssueId: `TEAM-${Math.floor(Math.random() * 10000)}`,
          externalUrl: `https://jira.example.com/browse/TEAM-${Math.floor(
            Math.random() * 10000
          )}`,
        };
      }),
      verifyIntegration: jest.fn().mockResolvedValue({
        isSuccessful: true,
        validatedCount: 3,
        failedCount: 0,
      }),
    };

    // Setup: NotificationServiceAdapterをスタブ化
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (message: string) => {
        notificationCalls.push({ message });
        return {
          deliveryStatus: 'success',
          sentAt: new Date('2024-01-15T10:00:00Z'),
        };
      }),
    };

    // Setup: AIクライアントスタブ
    const mockAiClient: Tx5Imp1AiClient = {
      buildAction01Prompt: jest.fn(() => {
        actionCallHistory.push('action-01');
        return 'Validate extracted issue data format and content';
      }),
      buildAction02Prompt: jest.fn(() => {
        actionCallHistory.push('action-02');
        return 'Auto-judge priority and category';
      }),
      buildAction03Prompt: jest.fn(() => {
        actionCallHistory.push('action-03');
        return 'Execute tool integration settings';
      }),
      buildAction04Prompt: jest.fn(() => {
        actionCallHistory.push('action-04');
        return 'Complete registration to Jira/Asana';
      }),
      buildAction05Prompt: jest.fn(() => {
        actionCallHistory.push('action-05');
        return 'Record and notify integration completion status';
      }),
      callAiModel: jest
        .fn()
        .mockResolvedValueOnce({
          validationPassed: true,
          issues: extractedIssueData,
        })
        .mockResolvedValueOnce({
          priorityJudgments: [
            {
              issueId: 'issue-001',
              priorityScore: 85,
              category: 'Infrastructure',
            },
            {
              issueId: 'issue-002',
              priorityScore: 62,
              category: 'Performance',
            },
            {
              issueId: 'issue-003',
              priorityScore: 35,
              category: 'Operations',
            },
          ],
        })
        .mockResolvedValueOnce({
          integrationReady: true,
        })
        .mockResolvedValueOnce({
          registeredIssues: [
            {
              issueId: 'issue-001',
              toolIssueId: 'TEAM-1001',
            },
            {
              issueId: 'issue-002',
              toolIssueId: 'TEAM-1002',
            },
            {
              issueId: 'issue-003',
              toolIssueId: 'TEAM-1003',
            },
          ],
        })
        .mockResolvedValueOnce({
          integrationCompleted: true,
          timestamp: new Date('2024-01-15T10:00:00Z'),
        }),
    };

    // Execute: runTx5Imp1Agent関数を実行
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockAiClient
    );

    // Verify: Action 01が実行されたことを確認
    expect(actionCallHistory).toContain('action-01');
    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalled();

    // Verify: Action 02が実行されたことを確認
    expect(actionCallHistory).toContain('action-02');
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalled();

    // Verify: Action 03が実行されたことを確認
    expect(actionCallHistory).toContain('action-03');
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalled();

    // Verify: Action 04が実行されたことを確認
    expect(actionCallHistory).toContain('action-04');
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalled();

    // Verify: Action 05が実行されたことを確認
    expect(actionCallHistory).toContain('action-05');
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalled();

    // Verify: アクション実行順序が正確であることを確認
    expect(actionCallHistory).toEqual([
      'action-01',
      'action-02',
      'action-03',
      'action-04',
      'action-05',
    ]);

    // Verify: 戻り値がすべてのアクション正常終了を示していることを確認
    expect(result).toBeDefined();
    expect(result.validatedIssues).toHaveLength(3);
    expect(result.integrationResult).toBeDefined();
    expect(result.executionSummary).toBeDefined();

    // Verify: 各案件の検証状態が「valid」であることを確認
    result.validatedIssues.forEach((issue: ValidatedIssue) => {
      expect(issue.validationStatus).toBe('valid');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(issue.priorityRank);
      expect(issue.category).toBeTruthy();
    });

    // Verify: 優先度スコアが期待値であることを確認
    const issue001 = result.validatedIssues.find(
      (i: ValidatedIssue) => i.issueId === 'issue-001'
    );
    expect(issue001?.priorityScore).toBe(85);
    expect(issue001?.priorityRank).toBe('high');

    const issue002 = result.validatedIssues.find(
      (i: ValidatedIssue) => i.issueId === 'issue-002'
    );
    expect(issue002?.priorityScore).toBe(62);
    expect(issue002?.priorityRank).toBe('medium');

    const issue003 = result.validatedIssues.find(
      (i: ValidatedIssue) => i.issueId === 'issue-003'
    );
    expect(issue003?.priorityScore).toBe(35);
    expect(issue003?.priorityRank).toBe('low');

    // Verify: 既存ツール連携結果が3件すべて成功していることを確認
    expect(result.integrationResult.successCount).toBe(3);
    expect(result.integrationResult.failureCount).toBe(0);

    // Verify: 各案件のtoolIssueIdが設定されていることを確認
    result.validatedIssues.forEach((issue: ValidatedIssue) => {
      expect(issue.toolIssueId).toBeTruthy();
      expect(issue.toolIssueId).toMatch(/^TEAM-\d+$/);
    });

    // Verify: ステータスが「連携完了」であることを確認
    expect(result.integrationResult.status).toBe('success');

    // Verify: 人手による承認がなかったことをログから確認
    expect(result.executionSummary.requiresManualApproval).toBe(false);
    expect(result.executionSummary.escalationCount).toBe(0);

    // Verify: 実行完了時刻が記録されていることを確認
    expect(result.executionSummary.completedAt).toBeDefined();
    expect(result.executionSummary.totalProcessingTimeMs).toBeGreaterThan(0);

    // Verify: すべてのアクションが正常終了したことを確認
    expect(result.executionSummary.status).toBe('completed');
    expect(result.executionSummary.errorsEncountered).toHaveLength(0);
  });
});