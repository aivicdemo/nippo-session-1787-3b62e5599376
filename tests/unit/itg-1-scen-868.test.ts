import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  test('SCEN-868: 報告期限の時刻が空文字列で渡されたときエラーになる', () => {
    // Arrange: NotificationServiceAdapterのスタブを準備
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: 0, failed: 0, pending: 0 }),
    };

    const invalidInput: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act & Assert: 報告期限の時刻フィールドが空文字列の場合、バリデーションエラーが発生することを検証
    expect(() =>
      sendDailyReportReminder(invalidInput, notificationServiceAdapterStub),
    ).toThrow(/報告期限/);

    // Assert: NotificationServiceAdapterのscheduleNotificationメソッドが呼び出されていないことを確認
    expect(notificationServiceAdapterStub.scheduleNotification).not.toHaveBeenCalled();
  });
});