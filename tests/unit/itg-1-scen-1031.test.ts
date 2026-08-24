import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder - リマインド通知機能', () => {
  test('SCEN-1031: [normal] リマインド通知機能 - リマインド通知に報告期限までの残り時間が表示される', async () => {
    // モック時刻: 2024-01-15 09:30:00 UTC
    const mockCurrentTime = new Date('2024-01-15T09:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const scheduledTime = new Date('2024-01-15T09:30:00Z');
    
    // 期待される残り時間: 30分
    const expectedRemainingMinutes = 30;

    // NotificationServiceAdapterのモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: mockCurrentTime,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    // テスト入力: チーム1名、リマインド対象
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email'],
    };

    // sendDailyReportReminderを実行
    // 注: 実装側で現在時刻を参照するため、テスト環境で時刻を固定する必要があります
    // ここではモックされたアダプタを渡して通知内容を検証します
    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter
    );

    // モック呼び出しを検証
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    // 送信されたリマインド通知の詳細を検証
    const notificationCall = mockNotificationServiceAdapter.sendReminderNotification.mock.calls[0];
    const sentNotificationPayload = notificationCall[0];

    // ペイロードに残り時間情報が含まれることを検証
    expect(sentNotificationPayload).toHaveProperty('remainingTimeMinutes');
    expect(sentNotificationPayload.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    // 通知ペイロードに時間差分が正確に記録されていることを検証
    // 残り時間 = 10:00 - 09:30 = 30分
    expect(sentNotificationPayload.remainingTimeMinutes).toEqual(30);

    // 結果オブジェクトの検証
    expect(result).toHaveProperty('sentCount');
    expect(result).toHaveProperty('failedCount');
    expect(result).toHaveProperty('remainingTimeMinutes');
    expect(result).toHaveProperty('notificationDetails');

    // 残り時間が出力に含まれていることを検証
    expect(result.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    // 通知詳細が配列であり、ステータスが記録されていることを検証
    expect(Array.isArray(result.notificationDetails)).toBe(true);
    expect(result.notificationDetails.length).toBeGreaterThan(0);

    // 最初の通知詳細のステータスを検証
    const firstNotificationDetail: ReminderNotificationDetail = result.notificationDetails[0];
    expect(firstNotificationDetail).toHaveProperty('userId');
    expect(firstNotificationDetail).toHaveProperty('status');
    expect(['sent', 'failed', 'skipped']).toContain(firstNotificationDetail.status);
  });
});