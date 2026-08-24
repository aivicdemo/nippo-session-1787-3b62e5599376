import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-867
  test('リマインド通知自動送信機能 - 報告期限の時刻がnullで渡されたときエラーになる', () => {
    const notificationServiceAdapterMock = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      scheduledTime: new Date('2026-08-20T08:30:00Z'),
      teamIds: ['team001'],
      reportDeadlineTime: null as unknown as Date,
      notificationChannels: ['email', 'in_app', 'slack'] as const,
    };

    expect(() =>
      sendDailyReportReminder(input, notificationServiceAdapterMock)
    ).toThrow(/報告期限の時刻/);

    expect(notificationServiceAdapterMock.scheduleNotification).not.toHaveBeenCalled();
  });
});