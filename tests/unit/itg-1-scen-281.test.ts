import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

// SCEN-281
describe('朝会報告リマインド通知自動送信機能 - チームメンバーリストが空配列のとき', () => {
  test('チームメンバーリストが空配列のとき処理が中断されエラーメッセージがスローされる', () => {
    // Arrange: NotificationServiceAdapterのモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: [], // チームメンバーリストを空配列で初期化
      reportDeadlineTime,
      notificationChannels: ['email', 'slack'],
    };

    // Act & Assert: 処理が実行され、適切なエラーがスローされることを確認
    expect(() => {
      sendDailyReportReminder(input, mockNotificationServiceAdapter);
    }).toThrow(/チームメンバー/);

    // Assert: NotificationServiceAdapterのsendReminderNotificationメソッドが呼び出されていないことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});