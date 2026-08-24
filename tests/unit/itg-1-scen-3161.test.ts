import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-3161
  test('[error] 既存ツール連携途中失敗時に完了済み副作用を巻き戻し・補償する', async () => {
    const agentExecutionId = 'exec-5imp1-test-20240115-001';
    const extractedIssueId = 'ISSUE-001';
    const extractedIssueText = 'データベース接続タイムアウト';
    const jiraIssueIdCreated = 'JIRA-12345';
    const trustConfidenceScore = 0.92;
    const priorityRankAssigned = 'high';
    const categoryAssigned = 'infra';
    const asanaApiErrorMessage = 'Asana API failure: 500 Internal Server Error';

    // Mock AI client
    const mockAiClient: Partial<Tx5Imp1AiClient> = {
      callAction01ValidateIssue: jest.fn(async () => ({
        isValid: true,
        issues: [
          {
            issueId: extractedIssueId,
            text: extractedIssueText,
            extractedAt: new Date('2024-01-15T09:00:00Z'),
          },
        ],
      })),
      callAction02JudgePriority: jest.fn(async () => ({
        priorityJudgments: [
          {
            issueId: extractedIssueId,
            priorityScore: 85,
            priorityRank: priorityRankAssigned,
            category: categoryAssigned,
            confidenceScore: trustConfidenceScore,
          },
        ],
      })),
      callAction03PrepareToolIntegration: jest.fn(async () => ({
        toolPayloads: [
          {
            issueId: extractedIssueId,
            jiraPayload: {
              summary: extractedIssueText,
              description: `Original issue: ${extractedIssueId}`,
              priority: 'High',
              issueType: 'Bug',
            },
            asanaPayload: {
              name: extractedIssueText,
              notes: `Original issue: ${extractedIssueId}`,
              priority: 'high',
            },
          },
        ],
      })),
      callAction04RegisterToTools: jest.fn(async () => {
        throw new Error(asanaApiErrorMessage);
      }),
      callAction05NotifyCompletion: jest.fn(async () => ({
        notificationSent: true,
        message: `既存ツール連携エラーが発生しました。課題 ${extractedIssueId} の登録がロールバックされました`,
      })),
    };

    // Mock external services
    const mockJiraApi = {
      createIssue: jest.fn(async () => ({
        id: jiraIssueIdCreated,
        key: jiraIssueIdCreated,
      })),
      deleteIssue: jest.fn(async () => ({ success: true })),
      updateIssue: jest.fn(async () => ({ success: true })),
    };

    const mockAsanaApi = {
      createTask: jest.fn(async () => {
        throw new Error(asanaApiErrorMessage);
      }),
    };

    const mockNotificationService = {
      sendReminderNotification: jest.fn(async () => ({
        deliveryStatus: 'sent',
        timestamp: new Date('2024-01-15T09:05:00Z'),
      })),
    };

    const mockAuditLogger = {
      logRollback: jest.fn(async (record: {
        agentExecutionId: string;
        action: number;
        status: string;
        affectedResources: string[];
        timestamp: Date;
        reason: string;
      }) => ({
        logged: true,
        recordId: 'audit-001',
      })),
    };

    const toolIntegrationConfig = {
      targetToolType: 'jira' as const,
      jiraBaseUrl: 'https://jira.example.com',
      asanaAccessToken: 'asana-token-stub',
      projectManagerId: 'pm-001',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      confidenceThreshold: 0.8,
    };

    const categoryMappings = [
      {
        sourceCategory: 'database',
        targetJiraCategory: 'Infra',
        targetAsanaCategory: 'Infrastructure',
      },
      {
        sourceCategory: 'api',
        targetJiraCategory: 'Defect',
        targetAsanaCategory: 'Bug',
      },
    ];

    const inputData = {
      extractedIssueData: [
        {
          issueId: extractedIssueId,
          text: extractedIssueText,
          extractedAt: new Date('2024-01-15T09:00:00Z'),
          confidenceScore: 0.92,
        },
      ],
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const result = await runTx5Imp1Agent(inputData, mockAiClient as Tx5Imp1AiClient);

    // Action 1: Validate format and content
    expect(mockAiClient.callAction01ValidateIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssueData: inputData.extractedIssueData,
      })
    );

    // Action 2: Judge priority and category
    expect(mockAiClient.callAction02JudgePriority).toHaveBeenCalledWith(
      expect.objectContaining({
        priorityRules: inputData.priorityRules,
      })
    );

    // Action 3: Prepare tool integration
    expect(mockAiClient.callAction03PrepareToolIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryMappings: inputData.categoryMappings,
      })
    );

    // Action 4: Register to tools (fails on Asana)
    expect(mockAiClient.callAction04RegisterToTools).toHaveBeenCalled();

    // Verify rollback notification was sent
    expect(mockAiClient.callAction05NotifyCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        failedAction: 4,
      })
    );

    // Verify result indicates rollback completion
    expect(result.success).toBe(false);
    expect(result.rollbackStatus).toBe('COMPLETED');
    expect(result.failedAction).toBe(4);
    expect(result.compensatedResources).toContain(jiraIssueIdCreated);

    // Verify integrationResult reflects partial failure
    expect(result.integrationResult.status).toBe('partial_failure');
    expect(result.integrationResult.failedIssues).toContain(extractedIssueId);

    // Verify executionSummary records the error
    expect(result.executionSummary.exceptionOccurred).toBe(true);
    expect(result.executionSummary.exceptionMessage).toContain('Asana');
    expect(result.executionSummary.finalStatus).toBe('ROLLED_BACK');
  });
});