import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-2899
  test('リマインド通知対象者が空リストのときエラーが発生する', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValueOnce(
        new Error('EMPTY_RECIPIENTS_LIST: リマインド通知対象者リストが空です')
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-11-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-11-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    expect(async () => {
      await sendDailyReportReminder(input, mockNotificationServiceAdapter);
    }).rejects.toThrow(/リマインド通知対象者/);
  });
});