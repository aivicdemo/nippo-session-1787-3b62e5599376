import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  test('SCEN-2551: [normal] リマインド通知自動送信機能 - 定時到達時にチームメンバーが0名（チームが空）の場合、通知送信対象が0件として処理される', async () => {
    // Arrange: NotificationServiceAdapterのモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'skipped' as const,
        sentAt: null,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue(undefined),
    };

    const scheduledTime = new Date('2026-08-20T09:00:00Z');
    const reportDeadlineTime = new Date('2026-08-20T09:30:00Z');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['empty-team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act: 処理実行
    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    // Assert: 期待結果の検証
    // 1. sendReminderNotificationが呼び出されない（メンバーが0名なため）
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(0);

    // 2. 出力結果を検証
    expect(result).toEqual<SendDailyReportReminderOutput>({
      sentCount: 0,
      failedCount: 0,
      remainingTimeMinutes: 30,
      notificationDetails: [],
    });

    // 3. sentCountが0であることを確認
    expect(result.sentCount).toBe(0);

    // 4. failedCountが0であることを確認
    expect(result.failedCount).toBe(0);

    // 5. remainingTimeMinutesが正しく計算されている（30分）
    const expectedRemainingMinutes = 30;
    expect(result.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    // 6. notificationDetailsが空配列であることを確認
    expect(result.notificationDetails).toHaveLength(0);
  });
});