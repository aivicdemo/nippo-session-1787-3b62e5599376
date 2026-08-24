import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-2555: [error] リマインド通知自動送信機能 - 定時時刻が不正な形式のとき通知スケジュール登録に失敗する
  test('should reject invalid scheduledTime format and not invoke scheduleNotification', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const invalidTimeFormats = [
      '25:70:00',
      '9:60',
      'abc:def:ghi',
      '9.5',
      '24:00',
      '-1:30',
      '12:60:00',
      'not_a_time',
      '',
    ];

    for (const invalidFormat of invalidTimeFormats) {
      mockNotificationServiceAdapter.scheduleNotification.mockClear();

      const invalidInput = {
        scheduledTime: new Date(invalidFormat),
        teamIds: ['team-001'],
        reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
        notificationChannels: ['email'] as const,
      };

      expect(() => {
        sendDailyReportReminder(
          invalidInput,
          mockNotificationServiceAdapter
        );
      }).toThrow(/定時時刻/);

      expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
    }
  });
});