import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題の影響度判定と既存ツール連携', () => {
  // SCEN-1287: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能 - API認証エラーが初回で発生した場合、失敗原因の判定が正確である
  test('should correctly identify authentication error as API_AUTHENTICATION_ERROR and schedule first retry in 5 minutes', async () => {
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'ログイン画面のバグ',
        description: 'ユーザーがログインできない問題が発生',
        keywords: ['ログイン', 'バグ'],
        occurrenceFrequency: 3,
        impactScore: 75,
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      endpoint: 'https://jira.example.com/api',
      apiKey: 'test-api-key-placeholder',
      projectKey: 'DEV',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 5000,
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings = [
      {
        systemCategory: 'ログイン',
        toolCategory: 'Authentication',
      },
      {
        systemCategory: 'バグ',
        toolCategory: 'Bug',
      },
    ];

    const mockAiClient = {
      validateAndEnrichIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue-001',
            priorityScore: 72,
            priorityRank: 'high' as const,
            category: 'Authentication',
            toolIssueId: null,
            validationStatus: 'valid' as const,
          },
        ],
        validationMetadata: {
          totalProcessed: 1,
          passedValidation: 1,
          failedValidation: 0,
        },
      }),
      performToolIntegration: jest.fn(),
      generateIntegrationRetryPlan: jest.fn().mockResolvedValue({
        retrySchedule: {
          nextRetryDelayMs: 5000,
          attemptNumber: 1,
          maxRetries: 3,
          backoffMultiplier: 2,
        },
        failureReason: 'API_AUTHENTICATION_ERROR',
        httpStatus: 401,
      }),
    };

    const notificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockRejectedValueOnce(
          new Error('API_AUTHENTICATION_ERROR: 401 Unauthorized')
        ),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'failed',
        failureReason: 'API_AUTHENTICATION_ERROR',
        httpStatus: 401,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      }),
    };

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockAiClient,
      notificationServiceAdapter
    );

    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0]).toEqual({
      issueId: 'issue-001',
      priorityScore: 72,
      priorityRank: 'high',
      category: 'Authentication',
      toolIssueId: null,
      validationStatus: 'valid',
    });

    expect(result.integrationResult).toEqual({
      successCount: 0,
      failureCount: 1,
      retryScheduled: true,
      failureDetails: {
        failureReason: 'API_AUTHENTICATION_ERROR',
        httpStatus: 401,
        isRetryable: true,
        nextRetryDelayMs: 5000,
        attemptNumber: 1,
        maxRetries: 3,
      },
    });

    expect(result.executionSummary).toMatchObject({
      status: 'partial_failure',
      totalIssuesProcessed: 1,
      issuesValidated: 1,
      issuesIntegrated: 0,
      errorCount: 1,
      retryScheduledCount: 1,
      alertSentToAdmin: false,
    });

    expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(notificationServiceAdapter.getDeliveryStatus).toHaveBeenCalledTimes(1);

    const deliveryStatus = await notificationServiceAdapter.getDeliveryStatus();
    expect(deliveryStatus).toEqual({
      status: 'failed',
      failureReason: 'API_AUTHENTICATION_ERROR',
      httpStatus: 401,
      timestamp: new Date('2024-01-15T10:00:00Z'),
    });
  });
});