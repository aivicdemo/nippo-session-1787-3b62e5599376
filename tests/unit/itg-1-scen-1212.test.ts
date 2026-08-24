import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 agent: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1212: [normal] 既存ツール連携機能 - 連携完了後にシステムが連携完了ステータスを正常に記録する
  test('should record integration completion status after successful tool linkage', async () => {
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        userId: 'user-001',
        deliveredAt: new Date('2024-01-15T11:00:00Z').toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue-001',
            priorityScore: 85,
            priorityRank: 'high',
            category: 'product-quality',
            validationStatus: 'valid',
            toolIssueId: null,
          },
        ],
        executionSummary: {
          processingTimeMs: 1500,
          exceptionOccurred: false,
          finalStatus: 'completed',
        },
      }),
      integrateWithExistingTool: jest.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        retryScheduled: false,
        toolIntegrationId: 'integration-tx5-001',
      }),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          title: 'Database connection timeout',
          description: 'API timeout when connecting to production database',
          reportedBy: 'engineer-001',
          reportedAt: '2024-01-15T10:30:00Z',
          severity: 'high',
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/api',
        projectKey: 'PROJ',
        authToken: 'token-placeholder',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        highThreshold: 70,
        mediumThreshold: 40,
      },
      categoryMappings: [
        {
          sourceCategory: 'product-quality',
          targetCategory: 'Bug',
          targetProject: 'PROJ',
        },
      ],
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0].issueId).toBe('issue-001');
    expect(result.validatedIssues[0].priorityScore).toBe(85);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].category).toBe('product-quality');
    expect(result.validatedIssues[0].validationStatus).toBe('valid');

    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBe(1);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.retryScheduled).toBe(false);

    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.processingTimeMs).toBe(1500);
    expect(result.executionSummary.exceptionOccurred).toBe(false);
    expect(result.executionSummary.finalStatus).toBe('completed');

    expect(mockAiClient.validateAndClassifyIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: input.extractedIssueData,
        categoryMappings: input.categoryMappings,
        priorityRules: input.priorityRules,
      })
    );

    expect(mockAiClient.integrateWithExistingTool).toHaveBeenCalledWith(
      expect.objectContaining({
        validatedIssues: expect.arrayContaining([
          expect.objectContaining({
            issueId: 'issue-001',
            priorityScore: 85,
          }),
        ]),
        toolIntegrationConfig: input.toolIntegrationConfig,
      })
    );
  });
});