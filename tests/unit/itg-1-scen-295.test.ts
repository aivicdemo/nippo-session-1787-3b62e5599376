import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  test('SCEN-295: 定時8時30分ちょうどに到達した時、登録済みチームメンバー10名全員に通知が送信される', () => {
    // Arrange: NotificationServiceAdapterをモック化
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'sent' as const,
        sentAt: new Date(),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 0,
        failed: 0,
        pending: 0,
      }),
    };

    // 登録済みチームメンバー10名のデータを準備
    const teamMembers = Array.from({ length: 10 }, (_, i) => ({
      userId: `user-${String(i + 1).padStart(2, '0')}`,
      userName: `Member ${i + 1}`,
      email: `member${i + 1}@example.com`,
    }));

    // システム時刻を2026年8月19日 08:30:00（JST）に設定
    const scheduledTime = new Date('2026-08-19T08:30:00+09:00');
    const reportDeadlineTime = new Date('2026-08-19T09:00:00+09:00');

    // リマインド通知送信のために必要な入力データを構成
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act: sendDailyReportReminderを呼び出し、結果を取得
    const result = sendDailyReportReminder(
      input,
      notificationServiceAdapter,
      teamMembers
    );

    // Assert: 通知送信の回数と内容を検証
    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);

    // 各メンバーへの通知送信結果を検証
    expect(result.notificationDetails).toHaveLength(10);
    result.notificationDetails.forEach((detail: ReminderNotificationDetail, index: number) => {
      expect(detail.userId).toBe(`user-${String(index + 1).padStart(2, '0')}`);
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeDefined();
      expect(detail.errorMessage).toBeNull();
    });

    // 期限までの残り時間が30分（08:30 → 09:00）であることを検証
    expect(result.remainingTimeMinutes).toBe(30);

    // NotificationServiceAdapterのsendReminderNotificationが正確に10回呼び出されたことを検証
    expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    // 各呼び出しの引数を検証
    teamMembers.forEach((member, index) => {
      const callArgs = notificationServiceAdapter.sendReminderNotification.mock.calls[index];
      expect(callArgs).toBeDefined();
      expect(callArgs[0]).toEqual({
        userId: member.userId,
        message: expect.stringContaining('朝会報告'),
        channels: ['email', 'in_app', 'slack'],
      });
    });
  });
});