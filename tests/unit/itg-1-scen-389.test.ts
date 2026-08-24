import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification', () => {
  // SCEN-389: [edge] 定時リマインド送信機能 - 残り時間の計算で端数が生じる場合（例：123.7分）、四捨五入により整数に丸められる
  test('should round fractional remaining minutes to nearest integer when sending reminder notifications', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:33:42Z'); // 123.7 minutes after scheduledTime
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, remainingMinutes: number, channels: typeof notificationChannels) => {
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:30:00Z'),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ delivered: 0, failed: 0, pending: 0 })),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
    );

    // 期待値: 残り時間 123.7 分が四捨五入により 124 分となる
    const expectedRoundedMinutes = 124;

    // NotificationServiceAdapterのsendReminderNotificationメソッドが呼び出されたことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    // sendReminderNotificationが正確に丸められた値（124分）で呼び出されたことを確認
    const callArgs = mockNotificationServiceAdapter.sendReminderNotification.mock.calls[0];
    expect(callArgs[1]).toBe(expectedRoundedMinutes);

    // 出力の remainingTimeMinutes が正確に丸められた値（124分）であることを確認
    expect(result.remainingTimeMinutes).toBe(expectedRoundedMinutes);

    // 通知配信ログに記録された残り時間が整数値（124）であることを確認
    const notificationDetail: ReminderNotificationDetail | undefined = result.notificationDetails[0];
    expect(notificationDetail).toBeDefined();
    expect(Number.isInteger(result.remainingTimeMinutes)).toBe(true);
  });
});