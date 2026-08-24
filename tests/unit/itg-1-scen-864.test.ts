import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  test('SCEN-864: 送信対象ユーザーのIDがnullで渡されたときエラーになる', () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent', sentAt: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' })
    };

    const input = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'] as const
    };

    const invalidNotificationDetails = [
      {
        userId: null,
        status: 'skipped' as const,
        sentAt: null,
        errorMessage: 'ユーザーID（null）は無効です'
      }
    ];

    expect(() => {
      sendDailyReportReminder(input, mockNotificationAdapter);
    }).toThrow(/ユーザーID/);

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});