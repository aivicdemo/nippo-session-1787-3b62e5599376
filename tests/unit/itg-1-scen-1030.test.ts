import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知機能', () => {
  test('SCEN-1030: 毎朝定時にチームメンバーへリマインド通知が送信される', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00+09:00');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00+09:00');
    const teamIds = ['team_001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const sentNotifications: Array<{ userId: string; channel: string; timestamp: Date }> = [];
    const notificationLog: Array<{
      userId: string;
      deliveryStatus: string;
      scheduledTime: string;
      sentTimestamp: Date;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channel: string) => {
        sentNotifications.push({
          userId,
          channel,
          timestamp: new Date(),
        });
        notificationLog.push({
          userId,
          deliveryStatus: 'success',
          scheduledTime: '09:00',
          sentTimestamp: new Date(),
        });
        return {
          userId,
          status: 'sent',
          sentAt: new Date(),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async (userId: string, time: string, message: string) => {
        return { scheduled: true };
      }),
      getDeliveryStatus: jest.fn(async (userId: string) => {
        return { userId, status: 'success' };
      }),
    };

    const input = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result).toBeDefined();
    expect(typeof result.sentCount).toBe('number');
    expect(typeof result.failedCount).toBe('number');
    expect(typeof result.remainingTimeMinutes).toBe('number');
    expect(Array.isArray(result.notificationDetails)).toBe(true);

    const expectedRemainingMinutes = Math.floor(
      (reportDeadlineTime.getTime() - scheduledTime.getTime()) / (1000 * 60)
    );
    expect(result.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    expect(notificationLog.length).toBeGreaterThan(0);
    const logEntry = notificationLog[0];
    expect(logEntry.userId).toBeDefined();
    expect(logEntry.deliveryStatus).toBe('success');
    expect(logEntry.scheduledTime).toBe('09:00');
    expect(logEntry.sentTimestamp).toBeDefined();

    const deliveryStatus = await mockNotificationServiceAdapter.getDeliveryStatus('member_001');
    expect(deliveryStatus.status).toBe('success');

    expect(result.notificationDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: expect.stringMatching(/sent|skipped/),
        }),
      ])
    );
  });
});