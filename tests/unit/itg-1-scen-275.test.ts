import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder', () => {
  test('SCEN-275: [normal] 朝会報告リマインド通知送信機能 - 登録済みチームメンバー1名に対してリマインド通知が送信される', async () => {
    const now = new Date('2024-01-15T08:30:00Z');
    const deadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const remainingTimeMinutes = 30;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        deliveryId: 'notif-001',
        sentAt: now,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue(undefined),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime: deadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        notificationType: 'reminder',
        channels: ['email', 'in_app', 'slack'],
      }),
    );

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(remainingTimeMinutes);
    expect(result.notificationDetails).toHaveLength(1);

    const notificationDetail: ReminderNotificationDetail = result.notificationDetails[0];
    expect(notificationDetail.userId).toBe('user-123');
    expect(notificationDetail.status).toBe('sent');
    expect(notificationDetail.sentAt).toEqual(now);
    expect(notificationDetail.errorMessage).toBeUndefined();
  });
});