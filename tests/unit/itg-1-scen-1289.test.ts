import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX5-IMP1 Agent - Orchestrator', () => {
  // SCEN-1289: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能 - 複数の異なる失敗原因が同一リトライシーケンス内で連続発生した場合、各々が正確に判定される
  test('should handle multiple distinct failure reasons across retry sequence with correct attribution and admin alert', async () => {
    // Setup: Prepare retry sequence with three different failure modes
    const retryFailureSequence = [
      { attempt: 1, failureType: 'NETWORK_TIMEOUT', intervalMs: 300000 }, // 5 minutes
      { attempt: 2, failureType: 'INVALID_AUTH_TOKEN', intervalMs: 900000 }, // 15 minutes
      { attempt: 3, failureType: 'RATE_LIMIT_EXCEEDED', intervalMs: 3600000 }, // 1 hour
    ];

    let currentAttempt = 0;
    const notificationLogs: Array<{
      attemptNumber: number;
      failureReason: string;
      timestamp: string;
      scheduledRetryIntervalMs: number | null;
    }> = [];
    const adminAlerts: Array<{
      finalFailureReason: string;
      retryCount: number;
      timestamp: string;
    }> = [];

    // Mock NotificationServiceAdapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => {
        currentAttempt++;
        const failureConfig = retryFailureSequence[currentAttempt - 1];

        if (!failureConfig) {
          throw new Error('Retry attempt exceeded sequence length');
        }

        // Simulate different failure modes
        if (failureConfig.failureType === 'NETWORK_TIMEOUT') {
          const error = new Error('Network request timeout');
          (error as any).code = 'ECONNABORTED';
          (error as any).failureReason = 'NETWORK_TIMEOUT';
          throw error;
        }

        if (failureConfig.failureType === 'INVALID_AUTH_TOKEN') {
          const error = new Error('Authentication token invalid');
          (error as any).code = 'UNAUTHORIZED';
          (error as any).failureReason = 'INVALID_AUTH_TOKEN';
          throw error;
        }

        if (failureConfig.failureType === 'RATE_LIMIT_EXCEEDED') {
          const error = new Error('Rate limit exceeded');
          (error as any).code = 'TOO_MANY_REQUESTS';
          (error as any).failureReason = 'RATE_LIMIT_EXCEEDED';
          throw error;
        }

        return { status: 'sent', deliveryId: 'msg-123' };
      }),
      scheduleNotification: jest.fn(async (config: {
        userId: string;
        message: string;
        delayMs: number;
      }) => {
        return { scheduleId: `sched-${Date.now()}` };
      }),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'pending',
        failureCount: 0,
      })),
    };

    // Mock RetryOrchestrator to capture retry attempts
    const mockRetryOrchestrator = {
      executeWithRetry: jest.fn(async (
        executeFunc: () => Promise<any>,
        config: {
          maxRetries: number;
          backoffMultiplier: number;
          initialDelayMs: number;
        }
      ) => {
        const attemptResults: Array<{
          attemptNum: number;
          failureReason: string | null;
          nextRetryIntervalMs: number | null;
        }> = [];

        for (let i = 1; i <= config.maxRetries + 1; i++) {
          try {
            const result = await executeFunc();
            return result;
          } catch (error: any) {
            const failureReason = error.failureReason || 'UNKNOWN_ERROR';

            // Calculate retry interval using exponential backoff
            let nextRetryIntervalMs: number | null = null;
            if (i <= config.maxRetries) {
              nextRetryIntervalMs =
                config.initialDelayMs *
                Math.pow(config.backoffMultiplier, i - 1);
            }

            // Log failure
            notificationLogs.push({
              attemptNumber: i,
              failureReason,
              timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
              scheduledRetryIntervalMs: nextRetryIntervalMs,
            });

            attemptResults.push({
              attemptNum: i,
              failureReason,
              nextRetryIntervalMs,
            });

            // If all retries exhausted, trigger admin alert
            if (i === config.maxRetries + 1) {
              const finalFailureReason =
                attemptResults[attemptResults.length - 1]?.failureReason ||
                'UNKNOWN_ERROR';
              adminAlerts.push({
                finalFailureReason,
                retryCount: config.maxRetries,
                timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
              });

              throw new Error(
                `Failed after ${config.maxRetries} retries. Final failure reason: ${finalFailureReason}`
              );
            }
          }
        }
      }),
    };

    // Prepare agent input
    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          title: 'Database connection timeout',
          description: 'Connection pool exhausted',
          extractedAt: new Date('2024-01-15T08:55:00Z'),
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira',
        apiEndpoint: 'https://api.atlassian.net/rest/api/3',
        projectKey: 'DEV',
        authenticate: true,
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        thresholds: {
          highPriority: 70,
          mediumPriority: 40,
          lowPriority: 0,
        },
      },
      categoryMappings: [
        {
          systemCategory: 'DATABASE',
          toolCategory: 'Infrastructure',
        },
      ],
    };

    // Mock AI client
    const mockAiClient = {
      validateAndClassifyIssues: jest.fn(async () => ({
        validatedIssues: [
          {
            issueId: 'ISSUE-001',
            priorityScore: 75,
            priorityRank: 'high',
            category: 'Infrastructure',
            toolIssueId: null,
            validationStatus: 'valid',
          },
        ],
      })),
      integrateWithExternalTools: jest.fn(async () => ({
        integrationResult: {
          successCount: 0,
          failureCount: 1,
          toolIssueIds: [],
          errorDetails: [
            {
              issueId: 'ISSUE-001',
              errorCode: 'ECONNABORTED',
              errorMessage: 'Network request timeout',
            },
          ],
        },
      })),
      executeRetrySequence: jest.fn(async () => {
        return mockRetryOrchestrator.executeWithRetry(
          async () => mockNotificationServiceAdapter.sendReminderNotification(),
          {
            maxRetries: 3,
            backoffMultiplier: 2,
            initialDelayMs: 300000, // 5 minutes initial
          }
        );
      }),
    };

    // Execute agent
    let agentError: Error | null = null;
    let agentOutput: Tx5Imp1AgentOutput | null = null;

    try {
      agentOutput = await runTx5Imp1Agent(agentInput, mockAiClient);
    } catch (error: any) {
      agentError = error;
    }

    // Assertions: Verify retry sequence captured all three distinct failure reasons
    expect(notificationLogs).toHaveLength(3);

    // First attempt: NETWORK_TIMEOUT
    expect(notificationLogs[0]).toEqual({
      attemptNumber: 1,
      failureReason: 'NETWORK_TIMEOUT',
      timestamp: '2024-01-15T09:00:00.000Z',
      scheduledRetryIntervalMs: 300000, // 5 minutes
    });

    // Second attempt: INVALID_AUTH_TOKEN
    expect(notificationLogs[1]).toEqual({
      attemptNumber: 2,
      failureReason: 'INVALID_AUTH_TOKEN',
      timestamp: '2024-01-15T09:00:00.000Z',
      scheduledRetryIntervalMs: 900000, // 15 minutes
    });

    // Third attempt: RATE_LIMIT_EXCEEDED
    expect(notificationLogs[2]).toEqual({
      attemptNumber: 3,
      failureReason: 'RATE_LIMIT_EXCEEDED',
      timestamp: '2024-01-15T09:00:00.000Z',
      scheduledRetryIntervalMs: null, // No further retry after 3rd attempt
    });

    // Verify scheduled retry intervals follow exponential backoff
    const firstInterval = notificationLogs[0].scheduledRetryIntervalMs;
    const secondInterval = notificationLogs[1].scheduledRetryIntervalMs;

    expect(firstInterval).toBe(300000); // 5 minutes
    expect(secondInterval).toBe(900000); // 15 minutes (5 * 2^1)

    // Verify admin alert was triggered with final failure reason
    expect(adminAlerts).toHaveLength(1);
    expect(adminAlerts[0]).toEqual({
      finalFailureReason: 'RATE_LIMIT_EXCEEDED',
      retryCount: 3,
      timestamp: '2024-01-15T09:00:00.000Z',
    });

    // Verify error is thrown after all retries exhausted
    expect(agentError).toBeDefined();
    expect(agentError?.message).toMatch(
      /Failed after 3 retries.*RATE_LIMIT_EXCEEDED/
    );

    // Verify no failure reason mixing or attribution errors
    const failureReasons = notificationLogs.map((log) => log.failureReason);
    expect(failureReasons).toEqual([
      'NETWORK_TIMEOUT',
      'INVALID_AUTH_TOKEN',
      'RATE_LIMIT_EXCEEDED',
    ]);

    // Verify each failure reason appears exactly once
    expect(new Set(failureReasons).size).toBe(3);
  });
});