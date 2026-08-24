import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

interface MockNotificationServiceAdapter {
  sendReminderNotification: jest.Mock;
  scheduleNotification: jest.Mock;
  getDeliveryStatus: jest.Mock;
}

describe('朝会報告リマインド通知自動送信機能', () => {
  // SCEN-283
  test('定時タイムスタンプが不正な形式のとき処理が中断される', async () => {
    const mockNotificationAdapter: MockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const invalidTimestamps = [
      '2026-13-45T99:99:99Z',
      'invalid-timestamp',
      '',
      null as any,
      undefined as any,
    ];

    for (const invalidTimestamp of invalidTimestamps) {
      mockNotificationAdapter.scheduleNotification.mockClear();
      mockNotificationAdapter.sendReminderNotification.mockClear();

      const input: SendDailyReportReminderInput = {
        scheduledTime: invalidTimestamp,
        teamIds: ['team-001', 'team-002'],
        reportDeadlineTime: new Date('2026-08-20T09:00:00Z'),
        notificationChannels: ['email', 'in_app'],
      };

      try {
        await sendDailyReportReminder(input, mockNotificationAdapter);
        fail('Should have thrown an error for invalid timestamp format');
      } catch (error) {
        expect(error).toBeDefined();
        expect(String(error)).toMatch(/タイムスタンプ|timestamp|Invalid/i);
        expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
        expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
      }
    }
  });
});