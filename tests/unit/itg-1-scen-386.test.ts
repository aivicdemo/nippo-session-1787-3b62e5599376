import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-386: 報告期限までの残り時間がちょうど0分（期限時刻）のとき、残り時間表示が「0分」となる
  test('残り時間が0分のとき remainingTimeMinutes が 0 を返す', () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'in_app', 'slack'];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        pending: 0,
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result).resolves.toMatchObject({
      sentCount: expect.any(Number),
      failedCount: expect.any(Number),
      remainingTimeMinutes: 30,
      notificationDetails: expect.any(Array),
    });
  });

  test('報告期限時刻ちょうど（残り時間0分）のとき remainingTimeMinutes が 0 を返す', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'in_app', 'slack'];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: reportDeadlineTime,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        pending: 0,
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result.remainingTimeMinutes).toBe(0);
    expect(result).toHaveProperty('sentCount');
    expect(result).toHaveProperty('failedCount');
    expect(result).toHaveProperty('notificationDetails');
    expect(Array.isArray(result.notificationDetails)).toBe(true);
  });
});