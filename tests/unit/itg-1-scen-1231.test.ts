import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('Tx5Imp1Agent - 既存ツール連携機能', () => {
  // SCEN-1231
  test('チームIDが null のとき、スケジュール通知登録が中断される', async () => {
    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockImplementation((teamId: string | null) => {
        if (teamId === null) {
          throw new Error('チームID');
        }
        return Promise.resolve({ scheduled: true });
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'ISSUE-001',
            priorityScore: 85,
            priorityRank: 'high',
            category: 'quality',
            validationStatus: 'valid',
          },
        ],
      }),
      integrateWithExistingTools: jest.fn().mockResolvedValue({
        integrationResult: {
          successCount: 0,
          failureCount: 1,
          retryScheduled: true,
        },
      }),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          content: 'Database connection timeout issue',
          frequency: 3,
          severity: 'high',
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiUrl: 'https://example.atlassian.net',
        projectKey: 'PROJ',
        teamId: null,
      },
      priorityRules: {
        frequencyWeight: 0.4,
        severityWeight: 0.6,
        frequencyThreshold: 2,
      },
      categoryMappings: [
        {
          systemCategory: 'quality',
          toolCategory: 'Bug',
        },
      ],
    };

    await expect(
      runTx5Imp1Agent(input, mockAiClient, mockNotificationAdapter),
    ).rejects.toThrow(/チームID/);

    expect(mockNotificationAdapter.scheduleNotification).toHaveBeenCalledWith(null);
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});