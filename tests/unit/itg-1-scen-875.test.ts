import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder - Error Handling for Negative Remaining Time', () => {
  // SCEN-875: [error] リマインド通知自動送信機能 - 期限までの残り時間がnegativeで計算されたときエラーになる
  test('should throw ReminderTimeCalculationError when deadline has already passed', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const mockAlertQueue: Array<{ type: string; message: string; timestamp: Date }> = [];

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2026-01-15T09:00:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2026-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const mockSystemTime = new Date('2026-01-15T09:15:00Z');

    const originalDateNow = Date.now;
    Date.now = jest.fn(() => mockSystemTime.getTime());

    try {
      expect(() =>
        sendDailyReportReminder(input, mockNotificationServiceAdapter, mockAlertQueue)
      ).toThrow(/残り時間/);
    } finally {
      Date.now = originalDateNow;
    }

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    const adminAlert = mockAlertQueue.find(
      (alert) =>
        alert.message.includes('残り時間がnegativeです') &&
        alert.message.includes('期限超過のため通知送信をスキップします')
    );
    expect(adminAlert).toBeDefined();
  });
});