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

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1267: [error] 既存ツール課題データ連携リトライ機能 - 連携APIデータ形式エラーが発生した場合、部長への手動対応通知を実行する
  test('should send manual intervention notification to manager after 3 retry failures due to data format error', async () => {
    // Setup: Mock Notification Service Adapter
    const sentNotifications: Array<{
      userId: string;
      message: string;
      timestamp: string;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValue(
        new Error('JSON parse error: Invalid data format at field "priority"')
      ),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: false }),
    };

    // Setup: Create extracted issues
    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Backend service fails to connect to DB',
        category: 'Infrastructure',
        severity: 'high',
        reportedBy: 'engineer-001',
        reportedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        frequency: 5,
        impactScore: 85,
      },
    ];

    // Setup: Tool integration config (Jira)
    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3/issues',
      apiKey: 'mock-api-key',
      projectKey: 'TEAM-001',
      authType: 'bearer_token',
    };

    // Setup: Priority rules
    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
      lowThreshold: 0,
    };

    // Setup: Category mappings
    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'Infrastructure',
        toolCategory: 'Bug',
        toolPriority: 'High',
      },
    ];

    // Setup: Integration retry config with short intervals for testing
    const retryConfig = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 100, // 100ms for testing instead of 5 minutes
    };

    // Setup: Input to agent
    const agentInput: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
      retryConfig,
      projectManagerId: 'pm-001',
      managerUserId: 'manager-001', // Manager to receive notification
    };

    // Mock fetch for retry attempts to fail with data format error
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // First retry attempt (5 min interval) - fails with 400 Bad Request
    fetchMock.mockRejectOnce(new Error('JSON parse error: Invalid data format at field "priority"'));

    // Second retry attempt (15 min interval) - fails with 400 Bad Request
    fetchMock.mockRejectOnce(new Error('JSON parse error: Invalid data format at field "priority"'));

    // Third retry attempt (1 hour interval) - fails with 400 Bad Request
    fetchMock.mockRejectOnce(new Error('JSON parse error: Invalid data format at field "priority"'));

    // Override notification adapter to track calls
    const originalSendNotification = mockNotificationServiceAdapter.sendReminderNotification;
    mockNotificationServiceAdapter.sendReminderNotification = jest
      .fn()
      .mockImplementation(
        async (userId: string, message: string) => {
          sentNotifications.push({
            userId,
            message,
            timestamp: new Date('2024-01-15T09:15:00Z').toISOString(),
          });
          throw new Error('Notification delivery failed');
        }
      );

    // Execute: Run agent with mocked notification service
    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      agentInput,
      mockNotificationServiceAdapter as any
    );

    // Verify: Check that retry logic was attempted 3 times
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verify: Check that manager notification was attempted after all retries failed
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'manager-001',
      expect.stringContaining('データ形式エラーにより自動連携に失敗しました')
    );

    // Verify: Check notification content includes required details
    const lastCallArgs = mockNotificationServiceAdapter.sendReminderNotification.mock.calls[
      mockNotificationServiceAdapter.sendReminderNotification.mock.calls.length - 1
    ];
    const notificationMessage = lastCallArgs[1];

    expect(notificationMessage).toMatch(/手動確認・対応が必要です/);
    expect(notificationMessage).toMatch(/JSON parse error/);
    expect(notificationMessage).toMatch(/priority/);
    expect(notificationMessage).toMatch(/issue-001/);

    // Verify: Integration result shows retry exhaustion and manual intervention required
    expect(output.integrationResult).toEqual(
      expect.objectContaining({
        successCount: 0,
        failureCount: 1,
        status: 'retry_exhausted',
        retryAttempts: 3,
        lastErrorMessage: expect.stringContaining('JSON parse error'),
        manualInterventionRequired: true,
      })
    );

    // Verify: Execution summary shows the data format error and notification status
    expect(output.executionSummary).toEqual(
      expect.objectContaining({
        status: 'partial_failure',
        errorCount: 3,
        notificationSent: true,
        managerNotificationDetails: expect.objectContaining({
          recipientUserId: 'manager-001',
          errorType: 'data_format_error',
          retryCount: 3,
          issueSummary: expect.stringContaining('Database connection timeout'),
        }),
      })
    );

    // Verify: Notification delivery log contains the manual intervention entry
    expect(sentNotifications).toHaveLength(1);
    expect(sentNotifications[0]).toEqual(
      expect.objectContaining({
        userId: 'manager-001',
        message: expect.stringContaining('手動確認・対応が必要です'),
      })
    );

    // Cleanup
    fetchMock.disableMocks();
  });
});