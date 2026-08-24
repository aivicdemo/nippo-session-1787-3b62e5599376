import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知自動送信機能', () => {
  // SCEN-293
  test('現在時刻がnullのとき残り時間計算処理でエラーがスローされ、通知送信は実行されない', async () => {
    // 現在時刻を null で返すモック化
    const mockGetCurrentTime = () => null;

    // NotificationServiceAdapterのスタブ
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent' as const,
      }),
    };

    // リマインド通知送信の入力データ
    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // sendDailyReportReminderを呼び出して、エラーがスローされることを期待
    await expect(
      sendDailyReportReminder(
        input,
        mockNotificationAdapter,
        mockGetCurrentTime
      )
    ).rejects.toThrow(/残り時間|null|時刻/i);

    // 通知送信アダプターが呼び出されていないことを確認
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});