import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-2896
  test('チームIDが未設定のときリマインド通知が送信されない', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds: string[] = [];
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockLogger
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/チームID/)
    );

    expect(result).toEqual({
      sentCount: 0,
      failedCount: 0,
      remainingTimeMinutes: 30,
      notificationDetails: [],
    });
  });
});