import { describe, test, expect, beforeEach, jest } from '@jest/globals';
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
  // SCEN-1263: [normal] 既存ツール連携API失敗時の自動リトライ機能 - リトライ途中で成功した場合、手動対応通知は生成されない
  test('should succeed on second retry after initial failure, with no alert notification generated', async () => {
    // Setup: Mock NotificationServiceAdapter with failure on first call, success on retry
    let callCount = 0;
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          // First call fails with HTTP 500
          throw new Error('HTTP 500: Internal Server Error');
        }
        // Second call (5 min retry) succeeds
        return {
          deliveryStatus: 'success',
          notificationId: 'notif-001',
          timestamp: new Date('2024-01-15T09:05:00Z').toISOString(),
        };
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({
        notificationId: 'notif-001',
        status: 'success',
      })),
    };

    // Sample extracted issue data for integration testing
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection pool exhausted during peak hours',
        confidenceScore: 0.92,
        extractedAt: new Date('2024-01-15T08:00:00Z').toISOString(),
      },
      {
        issueId: 'issue-002',
        title: 'API response delay',
        description: 'Response time exceeds SLA threshold',
        confidenceScore: 0.85,
        extractedAt: new Date('2024-01-15T08:00:00Z').toISOString(),
      },
    ];

    // Tool integration configuration
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'PROJ-001',
      authToken: 'Bearer token-placeholder',
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 5000,
      },
    };

    // Priority rules for scoring
    const priorityRules: PriorityRuleSet = {
      impactWeighting: 0.6,
      frequencyWeighting: 0.4,
      highPriorityThreshold: 75,
      mediumPriorityThreshold: 50,
    };

    // Category mappings for tool integration
    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'performance',
        toolCategory: 'Bug',
      },
      {
        systemCategory: 'integration',
        toolCategory: 'Task',
      },
    ];

    // Prepare input for orchestrator
    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Execute agent with mocked notification adapter
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockNotificationServiceAdapter as any
    );

    // Verify: Validated issues should contain priority scores and statuses
    expect(result.validatedIssues).toHaveLength(2);
    expect(result.validatedIssues[0]).toEqual(
      expect.objectContaining({
        issueId: 'issue-001',
        priorityScore: expect.any(Number),
        validationStatus: 'valid',
      })
    );

    // Verify: Integration result should show success after retry
    expect(result.integrationResult).toEqual(
      expect.objectContaining({
        successCount: 2,
        failureCount: 0,
        retryAttempts: 1,
        retrySuccessful: true,
      })
    );

    // Verify: Execution summary should reflect successful completion
    expect(result.executionSummary).toEqual(
      expect.objectContaining({
        status: 'completed_with_retries',
        totalProcessed: 2,
        alertsGenerated: 0,
      })
    );

    // Verify: No admin alert notification should be created
    // (alert threshold not exceeded because retry succeeded)
    expect(result.executionSummary.alertsGenerated).toBe(0);

    // Verify: Dashboard status should not contain delay warning message
    expect(result.executionSummary.dashboardStatus).not.toContain(
      '通知送信に遅延が発生しています'
    );

    // Verify: Mock was called exactly twice (initial + 1 retry success)
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);

    // Verify: No further retries at 15 min and 1 hour intervals
    // Since success on second retry, total call count should be 2
    expect(callCount).toBe(2);
  });
});