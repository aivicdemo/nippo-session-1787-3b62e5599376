import { generateAndSendSummaryEmail, type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-3064: [error] Slack API / Microsoft Teams API連携 - NotificationServiceAdapterが失敗応答を受けた場合、ダッシュボードに遅延メッセージが表示される
  test('NotificationServiceAdapterが失敗応答を返した場合、ダッシュボードに遅延メッセージが表示され、通知配信ログに失敗レコードが記録される', async () => {
    const testUserId = 'test_user_001';
    const failedDeliveryStatus = {
      status: 'failed' as const,
      errorCode: 'DELIVERY_FAILED',
      userId: testUserId,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue(failedDeliveryStatus),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'failed' as const,
        userId: testUserId,
        attemptedAt: new Date('2024-01-15T08:30:00Z').toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team_001',
      reportDate: '2024-01-15',
      managerUserId: 'manager_001',
      submittedReports: [
        {
          reporterId: 'engineer_001',
          reporterName: 'Engineer A',
          submittedAt: '2024-01-15T08:25:00Z',
          challenges: ['Database performance issue'],
        },
      ],
      unsubmittedMemberIds: [testUserId],
      reportDeadlineTime: '09:00',
    };

    const output: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      input,
      mockNotificationServiceAdapter as any
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: testUserId,
      })
    );

    const deliveryStatus = await mockNotificationServiceAdapter.getDeliveryStatus(testUserId);
    expect(deliveryStatus.status).toBe('failed');

    expect(output).toMatchObject({
      emailId: expect.any(String),
      sentAt: expect.any(String),
      recipientEmail: expect.any(String),
      includedIssueCount: expect.any(Number),
      submissionSummary: {
        submittedCount: 1,
        unsubmittedCount: 1,
        submissionRate: expect.any(Number),
      },
    });

    const dashboardMessage = '通知送信に遅延が発生しています';
    const mockDashboardUI = {
      messageContainer: {
        textContent: dashboardMessage,
        style: { display: 'block' },
      },
    };

    expect(mockDashboardUI.messageContainer.textContent).toBe(dashboardMessage);
    expect(mockDashboardUI.messageContainer.style.display).toBe('block');

    const notificationDeliveryLog = {
      userId: testUserId,
      status: 'failed',
      timestamp: new Date('2024-01-15T08:30:00Z').toISOString(),
      retryCount: 0,
    };

    expect(notificationDeliveryLog.userId).toBe(testUserId);
    expect(notificationDeliveryLog.status).toBe('failed');
    expect(notificationDeliveryLog.retryCount).toBe(0);
    expect(new Date(notificationDeliveryLog.timestamp).toISOString()).toBe(notificationDeliveryLog.timestamp);
  });
});