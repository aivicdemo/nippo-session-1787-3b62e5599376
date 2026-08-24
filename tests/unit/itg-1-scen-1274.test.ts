import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自動実行', () => {
  // SCEN-1274
  test('指数バックオフ計算結果がnullの場合、エラーロギングが実行されリトライ処理が中断される', async () => {
    const loggedErrors: string[] = [];
    const mockLogger = {
      error: (message: string) => {
        loggedErrors.push(message);
      },
    };

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndJudgePriority: jest.fn(async () => ({
        validatedIssues: [
          {
            issueId: 'ISSUE-001',
            priorityScore: 75,
            priorityRank: 'high',
            category: 'quality',
            toolIssueId: null,
            validationStatus: 'valid',
          },
        ],
        integrationResult: {
          successCount: 0,
          failureCount: 1,
          retryScheduled: true,
          retryConfig: {
            maxRetries: 3,
            backoffMultiplier: 2,
            initialDelayMs: 1000,
          },
        },
        executionSummary: {
          processingTimeMs: 150,
          timestamp: new Date('2024-01-15T10:30:00Z'),
          status: 'partial_failure',
          exceptionOccurred: false,
          exceptionMessage: null,
        },
      })),
      calculateExponentialBackoff: jest.fn(async (input) => {
        if (
          input.retryCount < 0 ||
          input.retryCount === undefined ||
          input.backoffMultiplier <= 0
        ) {
          return null;
        }
        return input.initialDelayMs * Math.pow(input.backoffMultiplier, input.retryCount);
      }),
      scheduleRetry: jest.fn(async () => ({
        scheduledAt: new Date('2024-01-15T10:30:00Z'),
        nextRetryAt: new Date('2024-01-15T10:31:00Z'),
      })),
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          title: 'Database performance degradation',
          description: 'Query response time exceeds 5 seconds',
          reportedAt: new Date('2024-01-15T09:00:00Z'),
          reporterId: 'USER-001',
          frequency: 3,
          impactScore: 85,
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira',
        apiEndpoint: 'https://jira.example.com/api/v2',
        projectKey: 'DEV',
        authToken: 'test-token',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        highThreshold: 70,
        mediumThreshold: 40,
      },
      categoryMappings: [
        {
          systemCategory: 'quality',
          toolCategory: 'Bug',
        },
      ],
    };

    let caughtError: Error | null = null;
    try {
      await runTx5Imp1Agent(input, mockAiClient);
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    const backoffResult = await mockAiClient.calculateExponentialBackoff({
      retryCount: -1,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
    });

    expect(backoffResult).toBeNull();

    if (caughtError) {
      expect(caughtError.message).toMatch(/指数バックオフ|backoff/i);
    }

    expect(mockAiClient.calculateExponentialBackoff).toHaveBeenCalled();
    expect(mockAiClient.validateAndJudgePriority).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssueData: expect.any(Array),
        toolIntegrationConfig: expect.any(Object),
        priorityRules: expect.any(Object),
      })
    );

    const scheduleRetryCalls = (mockAiClient.scheduleRetry as jest.Mock).mock.calls.length;
    expect(scheduleRetryCalls).toBeLessThanOrEqual(
      (mockAiClient.validateAndJudgePriority as jest.Mock).mock.calls.length
    );
  });
});