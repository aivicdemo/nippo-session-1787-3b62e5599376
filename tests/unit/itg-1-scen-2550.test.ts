import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - Idempotent Reminder Sending', () => {
  test('SCEN-2550: リマインド通知自動送信機能 - 同じ定時入力で2回リマインド送信ロジックを実行しても、同じメンバーセットに同じ残り時間で送信される', async () => {
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true, sentAt: new Date('2024-01-15T09:00:00Z') }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({}),
    };

    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const input1: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const input2: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const firstExecution = await sendDailyReportReminder(input1, notificationServiceAdapter);
    const secondExecution = await sendDailyReportReminder(input2, notificationServiceAdapter);

    expect(firstExecution.sentCount).toBe(secondExecution.sentCount);
    expect(firstExecution.failedCount).toBe(secondExecution.failedCount);
    expect(firstExecution.remainingTimeMinutes).toBe(secondExecution.remainingTimeMinutes);

    const firstNotificationDetails = firstExecution.notificationDetails || [];
    const secondNotificationDetails = secondExecution.notificationDetails || [];

    expect(firstNotificationDetails.length).toBe(secondNotificationDetails.length);

    const firstMemberSet = new Set(firstNotificationDetails.map((detail: ReminderNotificationDetail) => detail.userId));
    const secondMemberSet = new Set(secondNotificationDetails.map((detail: ReminderNotificationDetail) => detail.userId));

    expect(Array.from(firstMemberSet).sort()).toEqual(Array.from(secondMemberSet).sort());

    for (let i = 0; i < firstNotificationDetails.length; i++) {
      const firstDetail = firstNotificationDetails[i];
      const secondDetail = secondNotificationDetails.find((detail: ReminderNotificationDetail) => detail.userId === firstDetail.userId);

      expect(secondDetail).toBeDefined();
      expect(firstDetail.status).toBe(secondDetail?.status);
    }

    const callCount = notificationServiceAdapter.sendReminderNotification.mock.calls.length;
    expect(callCount).toBeGreaterThan(0);
  });
});