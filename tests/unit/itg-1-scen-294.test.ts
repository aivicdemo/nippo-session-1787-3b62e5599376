import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知自動送信機能', () => {
  // SCEN-294
  test('営業日カレンダーが登録されていないとき定時実行が中止される', async () => {
    const scheduledTime = new Date('2024-01-22T09:00:00+09:00');
    const reportDeadlineTime = new Date('2024-01-22T11:00:00+09:00');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime,
      notificationChannels: ['email', 'slack']
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn()
    };

    const mockCalendarService = {
      isBusinessDay: jest.fn().mockRejectedValueOnce(
        new Error('Calendar not found')
      )
    };

    expect(async () => {
      await sendDailyReportReminder(
        input,
        mockNotificationAdapter,
        mockCalendarService
      );
    }).rejects.toThrow(/Calendar/);

    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});