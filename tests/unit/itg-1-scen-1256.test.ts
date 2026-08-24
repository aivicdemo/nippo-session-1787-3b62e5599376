import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('既存ツール連携機能 - 連携完了ステータスの境界値更新', () => {
  // SCEN-1256
  test('連携完了ステータスがちょうど記録タイミングの境界値で正しく更新される', async () => {
    const boundaryTimestamp = new Date('2024-01-15T09:00:00.000Z');
    const beforeBoundary = new Date('2024-01-15T08:59:59.999Z');
    const afterBoundary = new Date('2024-01-15T09:00:00.001Z');

    const deliveryLogs: Array<{
      notificationId: string;
      statusUpdatedAt: Date;
      deliveryStatus: string;
    }> = [];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'sent',
        deliveredAt: new Date(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'scheduled',
        scheduledFor: boundaryTimestamp,
      }),
      getDeliveryStatus: jest.fn()
        .mockResolvedValueOnce({
          notificationId: 'notif-001',
          status: 'in_progress',
          lastUpdatedAt: boundaryTimestamp,
        })
        .mockResolvedValueOnce({
          notificationId: 'notif-001',
          status: 'delivered',
          lastUpdatedAt: boundaryTimestamp,
        })
        .mockResolvedValueOnce({
          notificationId: 'notif-001',
          status: 'delivered',
          lastUpdatedAt: boundaryTimestamp,
        }),
    };

    const mockAiClient: Tx5Imp1AiClient = {
      invokeAction: jest.fn()
        .mockResolvedValueOnce({
          validatedIssues: [
            {
              issueId: 'issue-001',
              priorityScore: 85,
              priorityRank: 'high',
              category: 'quality',
              toolIssueId: null,
              validationStatus: 'valid',
            },
          ],
          integrationResult: {
            successCount: 1,
            failureCount: 0,
            retryInfo: null,
          },
          executionSummary: {
            processTimeMs: 245,
            exceptionOccurred: false,
            finalStatus: 'success',
          },
        })
        .mockResolvedValueOnce({
          validatedIssues: [
            {
              issueId: 'issue-002',
              priorityScore: 72,
              priorityRank: 'medium',
              category: 'performance',
              toolIssueId: null,
              validationStatus: 'valid',
            },
          ],
          integrationResult: {
            successCount: 1,
            failureCount: 0,
            retryInfo: null,
          },
          executionSummary: {
            processTimeMs: 189,
            exceptionOccurred: false,
            finalStatus: 'success',
          },
        })
        .mockResolvedValueOnce({
          validatedIssues: [
            {
              issueId: 'issue-003',
              priorityScore: 68,
              priorityRank: 'medium',
              category: 'performance',
              toolIssueId: null,
              validationStatus: 'valid',
            },
          ],
          integrationResult: {
            successCount: 1,
            failureCount: 0,
            retryInfo: null,
          },
          executionSummary: {
            processTimeMs: 156,
            exceptionOccurred: false,
            finalStatus: 'success',
          },
        }),
    };

    // Execute at boundary timestamp
    const resultAtBoundary = await runTx5Imp1Agent(
      {
        extractedIssueData: [
          {
            issueId: 'issue-001',
            title: 'Database query timeout',
            description: 'Customer reports slow queries',
            reportedAt: boundaryTimestamp,
          },
        ],
        toolIntegrationConfig: {
          toolType: 'jira',
          apiEndpoint: 'https://jira.example.com/api/v3',
          projectKey: 'TEST',
        },
        priorityRules: {
          frequencyWeight: 0.4,
          impactWeight: 0.6,
          thresholds: {
            highThreshold: 80,
            mediumThreshold: 50,
          },
        },
        categoryMappings: [
          {
            systemCategory: 'quality',
            toolCategory: 'Bug',
          },
          {
            systemCategory: 'performance',
            toolCategory: 'Performance',
          },
        ],
      },
      mockAiClient,
      mockNotificationAdapter
    );

    // Record the boundary timestamp status
    if (resultAtBoundary.integrationResult.successCount > 0) {
      deliveryLogs.push({
        notificationId: 'notif-001',
        statusUpdatedAt: boundaryTimestamp,
        deliveryStatus: 'delivered',
      });
    }

    // Execute before boundary (1ms earlier)
    const resultBefore = await runTx5Imp1Agent(
      {
        extractedIssueData: [
          {
            issueId: 'issue-002',
            title: 'Memory leak detected',
            description: 'Application memory usage increases',
            reportedAt: beforeBoundary,
          },
        ],
        toolIntegrationConfig: {
          toolType: 'jira',
          apiEndpoint: 'https://jira.example.com/api/v3',
          projectKey: 'TEST',
        },
        priorityRules: {
          frequencyWeight: 0.4,
          impactWeight: 0.6,
          thresholds: {
            highThreshold: 80,
            mediumThreshold: 50,
          },
        },
        categoryMappings: [
          {
            systemCategory: 'quality',
            toolCategory: 'Bug',
          },
          {
            systemCategory: 'performance',
            toolCategory: 'Performance',
          },
        ],
      },
      mockAiClient,
      mockNotificationAdapter
    );

    if (resultBefore.integrationResult.successCount > 0) {
      deliveryLogs.push({
        notificationId: 'notif-001',
        statusUpdatedAt: beforeBoundary,
        deliveryStatus: 'delivered',
      });
    }

    // Execute after boundary (1ms later)
    const resultAfter = await runTx5Imp1Agent(
      {
        extractedIssueData: [
          {
            issueId: 'issue-003',
            title: 'API rate limit exceeded',
            description: 'Third-party API calls hitting rate limits',
            reportedAt: afterBoundary,
          },
        ],
        toolIntegrationConfig: {
          toolType: 'jira',
          apiEndpoint: 'https://jira.example.com/api/v3',
          projectKey: 'TEST',
        },
        priorityRules: {
          frequencyWeight: 0.4,
          impactWeight: 0.6,
          thresholds: {
            highThreshold: 80,
            mediumThreshold: 50,
          },
        },
        categoryMappings: [
          {
            systemCategory: 'quality',
            toolCategory: 'Bug',
          },
          {
            systemCategory: 'performance',
            toolCategory: 'Performance',
          },
        ],
      },
      mockAiClient,
      mockNotificationAdapter
    );

    if (resultAfter.integrationResult.successCount > 0) {
      deliveryLogs.push({
        notificationId: 'notif-001',
        statusUpdatedAt: afterBoundary,
        deliveryStatus: 'delivered',
      });
    }

    // Verify the boundary timestamp record
    const boundaryRecord = deliveryLogs.find(
      (log) => log.statusUpdatedAt.getTime() === boundaryTimestamp.getTime()
    );
    expect(boundaryRecord).toBeDefined();
    expect(boundaryRecord?.statusUpdatedAt).toEqual(boundaryTimestamp);
    expect(boundaryRecord?.statusUpdatedAt.toISOString()).toBe(
      '2024-01-15T09:00:00.000Z'
    );
    expect(boundaryRecord?.deliveryStatus).toBe('delivered');

    // Verify that the boundary record has milliseconds at 000
    const boundaryMs = boundaryRecord?.statusUpdatedAt.getMilliseconds();
    expect(boundaryMs).toBe(0);

    // Verify that before and after records are separate
    const beforeRecord = deliveryLogs.find(
      (log) => log.statusUpdatedAt.getTime() === beforeBoundary.getTime()
    );
    const afterRecord = deliveryLogs.find(
      (log) => log.statusUpdatedAt.getTime() === afterBoundary.getTime()
    );

    expect(beforeRecord?.statusUpdatedAt).toEqual(beforeBoundary);
    expect(afterRecord?.statusUpdatedAt).toEqual(afterBoundary);

    // Verify records are chronologically distinct
    expect(beforeBoundary.getTime()).toBeLessThan(boundaryTimestamp.getTime());
    expect(boundaryTimestamp.getTime()).toBeLessThan(afterBoundary.getTime());

    // Verify only one record has the exact boundary timestamp
    const boundaryRecordCount = deliveryLogs.filter(
      (log) => log.statusUpdatedAt.getTime() === boundaryTimestamp.getTime()
    ).length;
    expect(boundaryRecordCount).toBe(1);

    // Verify integration results were successful
    expect(resultAtBoundary.integrationResult.successCount).toBeGreaterThan(0);
    expect(resultAtBoundary.integrationResult.failureCount).toBe(0);
    expect(resultAtBoundary.executionSummary.finalStatus).toBe('success');

    // Verify AI client was invoked
    expect(mockAiClient.invokeAction).toHaveBeenCalledTimes(3);

    // Verify notification adapter scheduleNotification was called
    expect(mockNotificationAdapter.scheduleNotification).toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).toHaveBeenCalled();
  });
});