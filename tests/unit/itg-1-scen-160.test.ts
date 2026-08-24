import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('定時リマインド通知機能 - 報告期限時間表示', () => {
  // SCEN-160
  test('報告期限がちょうど24時間後であるとき、remainingTimeMinutesが1440分と計算される', () => {
    const scheduledTime = new Date('2026-08-19T10:00:00.000Z');
    const reportDeadlineTime = new Date('2026-08-20T10:00:00.000Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: 'sent', sentAt: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ delivered: 1, failed: 0 }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter
    );

    expect(result).resolves.toMatchObject({
      remainingTimeMinutes: 1440,
      sentCount: expect.any(Number),
      failedCount: expect.any(Number),
      notificationDetails: expect.any(Array),
    });
  });
});