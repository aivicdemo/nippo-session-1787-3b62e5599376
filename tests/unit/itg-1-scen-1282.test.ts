import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1282: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能
  test('第1回目リトライと第2回目リトライの間隔がちょうど指数バックオフの第1段階（1秒）である', async () => {
    // Initialize retry tracking
    const retryAttempts: Array<{ timestamp: number; attempt: number; success: boolean }> = [];
    const retryTimestamps: number[] = [];

    // Stub for NotificationServiceAdapter
    const notificationServiceStub = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        const currentTimestamp = Date.now();
        retryTimestamps.push(currentTimestamp);

        // First attempt fails, second attempt fails, third attempt succeeds
        const attemptNumber = retryAttempts.length + 1;

        if (attemptNumber === 1 || attemptNumber === 2) {
          retryAttempts.push({
            timestamp: currentTimestamp,
            attempt: attemptNumber,
            success: false,
          });
          throw new Error('API connection timeout');
        } else if (attemptNumber === 3) {
          retryAttempts.push({
            timestamp: currentTimestamp,
            attempt: attemptNumber,
            success: true,
          });
          return {
            deliveryStatus: 'success',
            deliveredAt: new Date(currentTimestamp).toISOString(),
          };
        }
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' })),
    };

    // Configure IntegrationRetryConfig with exponential backoff
    const retryConfig = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000, // First retry interval: 1 second
    };

    // Extract issue data
    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection failure',
        description: 'Connection pool exhaustion detected',
        severity: 'high',
        frequency: 3,
        impactScore: 85,
      },
      {
        issueId: 'issue-002',
        title: 'Memory leak in cache layer',
        description: 'Gradual memory increase observed',
        severity: 'medium',
        frequency: 2,
        impactScore: 65,
      },
    ];

    // Tool integration config
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://api.atlassian.com/2/issues',
      authToken: 'bearer-token-placeholder',
      projectKey: 'PROJ',
    };

    // Priority rules
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.3,
      impactWeight: 0.7,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    // Category mappings
    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategory: 'database',
        targetCategory: 'Infrastructure',
      },
      {
        sourceCategory: 'memory',
        targetCategory: 'Performance',
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Execute agent with retry logic
    let agentOutput: Tx5Imp1AgentOutput | null = null;
    let attemptCount = 0;

    const executeWithRetry = async (input: Tx5Imp1AgentInput, config: typeof retryConfig): Promise<Tx5Imp1AgentOutput> => {
      for (let retryAttempt = 0; retryAttempt < config.maxRetries; retryAttempt++) {
        try {
          if (retryAttempt === 0) {
            // Initial attempt (no delay)
            const result = await runTx5Imp1Agent(input, notificationServiceStub);
            return result;
          } else {
            // Calculate backoff delay for retry
            const delayMs = config.initialDelayMs * Math.pow(config.backoffMultiplier, retryAttempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            const result = await runTx5Imp1Agent(input, notificationServiceStub);
            return result;
          }
        } catch (error) {
          if (retryAttempt === config.maxRetries - 1) {
            throw error;
          }
        }
      }
      throw new Error('All retry attempts failed');
    };

    try {
      agentOutput = await executeWithRetry(agentInput, retryConfig);
    } catch (error) {
      // Error expected if all retries fail, but we configure the stub to succeed on 3rd attempt
    }

    // Verify retry attempts were recorded
    expect(retryAttempts).toHaveLength(3);

    // Verify first attempt failed
    expect(retryAttempts[0].attempt).toBe(1);
    expect(retryAttempts[0].success).toBe(false);

    // Verify second attempt failed
    expect(retryAttempts[1].attempt).toBe(2);
    expect(retryAttempts[1].success).toBe(false);

    // Verify third attempt succeeded
    expect(retryAttempts[2].attempt).toBe(3);
    expect(retryAttempts[2].success).toBe(true);

    // Verify the interval between first and second retry is 1 second (±100ms tolerance)
    const firstRetryTimestamp = retryAttempts[0].timestamp;
    const secondRetryTimestamp = retryAttempts[1].timestamp;
    const intervalBetweenFirstAndSecond = secondRetryTimestamp - firstRetryTimestamp;

    expect(intervalBetweenFirstAndSecond).toBeGreaterThanOrEqual(900); // 1000ms - 100ms tolerance
    expect(intervalBetweenFirstAndSecond).toBeLessThanOrEqual(1100); // 1000ms + 100ms tolerance

    // Verify that agent output contains valid results with proper validation status
    expect(agentOutput).toBeDefined();
    expect(agentOutput?.validatedIssues).toBeDefined();
    expect(agentOutput?.integrationResult).toBeDefined();
    expect(agentOutput?.executionSummary).toBeDefined();

    // Verify integration result reflects successful retry
    if (agentOutput?.integrationResult) {
      expect(agentOutput.integrationResult.successCount).toBeGreaterThanOrEqual(1);
    }

    // Verify execution summary records retry information
    if (agentOutput?.executionSummary) {
      expect(agentOutput.executionSummary.status).toBe('completed');
      expect(agentOutput.executionSummary.totalAttempts).toBe(3);
    }

    // Verify validated issues have correct priority ranks based on impact
    expect(agentOutput?.validatedIssues).toHaveLength(2);

    const issue1 = agentOutput?.validatedIssues.find((i) => i.issueId === 'issue-001');
    expect(issue1?.priorityRank).toBe('high');
    expect(issue1?.priorityScore).toBeGreaterThanOrEqual(75);
    expect(issue1?.validationStatus).toBe('valid');

    const issue2 = agentOutput?.validatedIssues.find((i) => i.issueId === 'issue-002');
    expect(issue2?.priorityRank).toBe('medium');
    expect(issue2?.priorityScore).toBeGreaterThanOrEqual(50);
    expect(issue2?.validationStatus).toBe('valid');

    // Verify notification adapter was called exactly 3 times
    expect(notificationServiceStub.sendReminderNotification).toHaveBeenCalledTimes(3);
  });
});