import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-1067
  test('ユーザーIDがnullのとき、通知送信がエラーになる', () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email' as const, 'in_app' as const],
    };

    // ユーザーIDをnullに設定した不正なデータ
    const invalidData = {
      userId: null,
      remainingMinutes: 30,
    };

    expect(() => {
      sendDailyReportReminder(input, mockNotificationAdapter, invalidData as any);
    }).toThrow(/ユーザーID/);
  });
});