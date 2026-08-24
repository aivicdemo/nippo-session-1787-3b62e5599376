import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-866
  test('送信対象ユーザーのIDが0で渡されたときエラーになる', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T09:30:00Z'),
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    expect(() =>
      sendDailyReportReminder(input, mockNotificationServiceAdapter)
    ).toThrow(/INVALID_USER_ID/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});