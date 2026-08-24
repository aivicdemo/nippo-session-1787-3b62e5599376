import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-2559: [error] リマインド通知自動送信機能 - チームIDが空文字列のとき対象メンバー特定に失敗する
  test('チームIDが空文字列のとき、エラーをスロー', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: [''],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email' as const],
    };

    expect(() =>
      sendDailyReportReminder(input, mockNotificationServiceAdapter),
    ).toThrow(/チームID/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});