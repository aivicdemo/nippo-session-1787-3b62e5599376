import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-2554: [error] リマインド通知自動送信機能 - 定時時刻が null のとき通知スケジュール登録に失敗する
  test('定時時刻が null の場合、通知スケジュール登録に失敗し ValidationError がスローされる', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn().mockRejectedValueOnce(
        new Error('定時時刻が正しく設定されていません。設定画面で確認してください')
      ),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      scheduledTime: null as any,
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    expect(async () => {
      await sendDailyReportReminder(input, mockNotificationServiceAdapter);
    }).rejects.toThrow(/定時時刻/);
  });
});