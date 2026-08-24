import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-869
  test('スケジュール定時がnullで渡されたときエラーになる', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const invalidInput: SendDailyReportReminderInput = {
      scheduledTime: null as any,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app'],
    };

    expect(() =>
      sendDailyReportReminder(invalidInput, mockNotificationServiceAdapter)
    ).toThrow(/スケジュール定時/);

    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});