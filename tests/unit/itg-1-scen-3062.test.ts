import { generateAndSendSummaryEmail, type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-3062
  test('[normal] Slack API / Microsoft Teams API連携 - NotificationServiceAdapter.scheduleNotificationが正常応答を受けた場合、定時配信スケジュールが登録される', async () => {
    const mockNotificationServiceAdapter = {
      scheduleNotification: jest.fn().mockResolvedValue({
        status: 'scheduled',
        scheduleId: 'sched-12345',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'scheduled',
        scheduleId: 'sched-12345',
        scheduledTime: '09:00',
      }),
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'eng-001',
          reporterName: 'Engineer A',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: ['Database performance issue'],
        },
        {
          reporterId: 'eng-002',
          reporterName: 'Engineer B',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['API latency'],
        },
      ],
      unsubmittedMemberIds: ['eng-003', 'eng-004'],
      reportDeadlineTime: '09:00',
    };

    const result = await generateAndSendSummaryEmail(input, mockNotificationServiceAdapter);

    expect(result).toBeDefined();
    expect(result.emailId).toBeTruthy();
    expect(result.sentAt).toBeTruthy();
    expect(result.recipientEmail).toBeTruthy();
    expect(result.includedIssueCount).toBeGreaterThanOrEqual(2);
    expect(result.submissionSummary.submittedCount).toBe(2);
    expect(result.submissionSummary.unsubmittedCount).toBe(2);
    expect(result.submissionSummary.submissionRate).toBe(50);

    expect(mockNotificationServiceAdapter.scheduleNotification).toHaveBeenCalled();
    const scheduleCall = mockNotificationServiceAdapter.scheduleNotification.mock.calls[0];
    expect(scheduleCall).toBeDefined();
    expect(scheduleCall[0]).toMatchObject({
      scheduledTime: '09:00',
      teamId: 'team-001',
    });

    const deliveryStatus = await mockNotificationServiceAdapter.getDeliveryStatus('sched-12345');
    expect(deliveryStatus.status).toBe('scheduled');
    expect(deliveryStatus.scheduleId).toBe('sched-12345');
    expect(deliveryStatus.scheduledTime).toBe('09:00');
  });
});