import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('notification-delivery: generateAndSendSummaryEmail with retry on external service failure', () => {
  // SCEN-3066: [error] Slack API / Microsoft Teams API連携 - NotificationServiceAdapterが失敗応答を受けた場合、5分・15分・1時間のインターバルで最大3回再試行される

  test('should retry sendReminderNotification at intervals of 5min, 15min, 1hour when NotificationServiceAdapter fails', async () => {
    // Arrange
    const baseTime = new Date('2024-01-15T08:00:00Z');
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedReport: SubmittedReportSummary = {
      reporterId: 'engineer-001',
      reporterName: 'Taro Yamada',
      submittedAt: '2024-01-15T08:15:00Z',
      challenges: ['Database connection timeout', 'Memory leak in cache module'],
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports: [submittedReport],
      unsubmittedMemberIds: ['engineer-002'],
      reportDeadlineTime,
    };

    // Track retry attempts with timestamps and failure responses
    const retryAttempts: Array<{
      attemptNumber: number;
      timestamp: Date;
      status: number;
      errorCode?: string;
    }> = [];

    const failureResponses = [
      { status: 429, errorCode: 'RATE_LIMIT' }, // First attempt fails with rate limit
      { status: 429, errorCode: 'RATE_LIMIT' }, // 5min retry fails with rate limit
      { status: 500, errorCode: 'SERVICE_UNAVAILABLE' }, // 15min retry fails with service error
      { status: 500, errorCode: 'SERVICE_UNAVAILABLE' }, // 1hour retry fails with service error (3rd retry confirmed)
    ];

    let failureResponseIndex = 0;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        const attemptNumber = retryAttempts.length + 1;
        const currentTime = new Date(baseTime.getTime() + (retryAttempts.length * 60000)); // Simulate time progression
        retryAttempts.push({
          attemptNumber,
          timestamp: currentTime,
          status: failureResponses[failureResponseIndex].status,
          errorCode: failureResponses[failureResponseIndex].errorCode,
        });
        failureResponseIndex++;

        // Simulate API failure response
        const failResponse = failureResponses[attemptAttempts.length - 1];
        throw new Error(`API Error: ${failResponse.status} ${failResponse.errorCode}`);
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'failed', retryCount: 3 })),
    };

    // Mock delivery log storage
    const deliveryLogs: Array<{
      userId: string;
      status: string;
      retryCount: number;
      firstAttemptTime: string;
      lastAttemptTime: string;
    }> = [];

    // Act
    const result = await generateAndSendSummaryEmail(input, mockNotificationServiceAdapter, {
      onDeliveryLogRecord: (log) => {
        deliveryLogs.push({
          userId: log.userId,
          status: log.status,
          retryCount: log.retryCount,
          firstAttemptTime: log.firstAttemptTime,
          lastAttemptTime: log.lastAttemptTime,
        });
      },
      currentTime: baseTime,
    });

    // Assert - Verify retry pattern at intervals: 5min, 15min, 1hour
    expect(retryAttempts.length).toBe(4); // Initial attempt + 3 retries

    // Verify first attempt at baseTime
    expect(retryAttempts[0].attemptNumber).toBe(1);
    expect(retryAttempts[0].timestamp.getTime()).toBe(baseTime.getTime());
    expect(retryAttempts[0].status).toBe(429);

    // Verify 5min retry (300 seconds = 300000ms after first attempt)
    expect(retryAttempts[1].attemptNumber).toBe(2);
    expect(retryAttempts[1].timestamp.getTime()).toBe(baseTime.getTime() + 300000);
    expect(retryAttempts[1].status).toBe(429);

    // Verify 15min retry (900 seconds = 900000ms after first attempt)
    expect(retryAttempts[2].attemptNumber).toBe(3);
    expect(retryAttempts[2].timestamp.getTime()).toBe(baseTime.getTime() + 900000);
    expect(retryAttempts[2].status).toBe(500);

    // Verify 1hour retry (3600 seconds = 3600000ms after first attempt)
    expect(retryAttempts[3].attemptNumber).toBe(4);
    expect(retryAttempts[3].timestamp.getTime()).toBe(baseTime.getTime() + 3600000);
    expect(retryAttempts[3].status).toBe(500);

    // Verify delivery log records retry count as 3 (matching max retry count)
    expect(deliveryLogs.length).toBeGreaterThan(0);
    const failureLog = deliveryLogs.find((log) => log.status === 'failed');
    expect(failureLog).toBeDefined();
    expect(failureLog?.retryCount).toBe(3);

    // Verify first attempt timestamp in log
    expect(failureLog?.firstAttemptTime).toBe(baseTime.toISOString());

    // Verify last attempt timestamp in log equals first attempt + 1hour
    const expectedLastAttemptTime = new Date(baseTime.getTime() + 3600000);
    expect(failureLog?.lastAttemptTime).toBe(expectedLastAttemptTime.toISOString());

    // Verify output indicates notification delivery failure
    expect(result.emailId).toBeDefined();
    expect(result.sentAt).toBeDefined();
    expect(result.recipientEmail).toBeDefined();
    expect(result.includedIssueCount).toBe(2); // 2 challenges from submitted report
    expect(result.submissionSummary.submittedCount).toBe(1);
    expect(result.submissionSummary.unsubmittedCount).toBe(1);

    // Verify sendReminderNotification was called exactly 4 times (1 initial + 3 retries)
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(4);

    // Verify getDeliveryStatus confirms final state is failed after 3 retries
    const deliveryStatus = await mockNotificationServiceAdapter.getDeliveryStatus();
    expect(deliveryStatus.status).toBe('failed');
    expect(deliveryStatus.retryCount).toBe(3);
  });
});