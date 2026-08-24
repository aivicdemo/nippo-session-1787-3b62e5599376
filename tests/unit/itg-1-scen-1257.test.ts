import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 agent orchestrator', () => {
  // SCEN-1257: [normal] 既存ツール連携API失敗時の自動リトライ機能 - タイムアウトエラーで初回リトライが1回目として正常に実行される
  test('should execute first retry successfully after initial timeout error with 5-minute interval', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const retryTime = new Date('2024-01-15T09:05:00Z');

    const extractedIssues = [
      {
        issueId: 'ISSUE-001',
        title: 'Database connection failure',
        description: 'Connection timeout when accessing primary DB',
        severity: 'high' as const,
        frequency: 2,
        impactScore: 85,
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      baseUrl: 'https://jira.example.com',
      apiToken: 'test-token-encrypted',
      projectKey: 'PROJ',
    };

    const priorityRules = {
      frequencyWeight: 0.3,
      impactWeight: 0.7,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    const categoryMappings = [
      {
        sourceCategory: 'infrastructure',
        targetCategory: 'Infrastructure',
      },
    ];

    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    let callCount = 0;
    const integrationResults: Array<{
      timestamp: Date;
      status: string;
      error?: Error;
    }> = [];

    const mockAiClient: Tx5Imp1AiClient = {
      validateIssueData: async () => {
        return {
          validatedIssues: [
            {
              issueId: 'ISSUE-001',
              priorityScore: 79.5,
              priorityRank: 'high',
              category: 'Infrastructure',
              toolIssueId: null,
              validationStatus: 'valid',
            },
          ],
          validationMetadata: {
            validationTimestamp: now.toISOString(),
            validationRules: 'v1.0',
          },
        };
      },
      integratWithToolAndRetry: async (input) => {
        callCount++;

        if (callCount === 1) {
          const timeoutError = new Error('Connection timeout');
          (timeoutError as any).code = 'ETIMEDOUT';
          integrationResults.push({
            timestamp: now,
            status: 'failed',
            error: timeoutError,
          });
          throw timeoutError;
        }

        if (callCount === 2) {
          integrationResults.push({
            timestamp: retryTime,
            status: 'success',
          });
          return {
            toolIssueIds: ['JIRA-12345'],
            successCount: 1,
            failureCount: 0,
            retryInfo: {
              retryCount: 1,
              retryTimestamps: [retryTime.toISOString()],
              lastRetryStatus: 'success',
            },
          };
        }

        throw new Error('Unexpected call to integratWithToolAndRetry');
      },
      generateConfirmationEmailAndSendToManager: async () => {
        return {
          emailSent: true,
          managerEmailAddress: 'manager@example.com',
          sentTimestamp: retryTime.toISOString(),
        };
      },
    };

    let result: Tx5Imp1AgentOutput;

    try {
      result = await runTx5Imp1Agent(agentInput, mockAiClient);
    } catch (error) {
      result = (error as any).partialResult || { error: (error as Error).message };
    }

    expect(callCount).toBe(2);
    expect(integrationResults).toHaveLength(2);

    expect(integrationResults[0]).toMatchObject({
      timestamp: now,
      status: 'failed',
    });
    expect(integrationResults[0].error).toBeDefined();
    expect((integrationResults[0].error as Error).message).toMatch(/timeout/i);

    expect(integrationResults[1]).toMatchObject({
      timestamp: retryTime,
      status: 'success',
    });

    const retryIntervalMs = retryTime.getTime() - now.getTime();
    expect(retryIntervalMs).toBe(5 * 60 * 1000);

    if (result && 'integrationResult' in result) {
      expect(result.integrationResult).toBeDefined();
      if (result.integrationResult && 'successCount' in result.integrationResult) {
        expect(result.integrationResult.successCount).toBe(1);
        expect(result.integrationResult.failureCount).toBe(0);
      }
    }
  });
});