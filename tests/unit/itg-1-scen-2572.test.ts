import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-2572
  test('リマインド通知自動送信機能 - 月初日（1日）の定時にリマインド通知が送信される', async () => {
    // システム日時を2026年9月1日09:00:00に設定
    const scheduledTime = new Date('2026-09-01T09:00:00Z');
    const reportDeadlineTime = new Date('2026-09-01T09:30:00Z');
    
    // 対象チーム
    const teamIds = ['team-001'];
    
    // 通知配信チャネル
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'in_app', 'slack'];

    // NotificationServiceAdapterのスタブ設定
    // sendReminderNotification呼び出し履歴を記録
    const sentNotifications: Array<{
      userId: string;
      status: 'sent' | 'failed' | 'skipped';
      sentAt: Date | null;
      errorMessage: string | null;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockImplementation(async (userId: string, channels: string[], remainingMinutesValue: number) => {
        const sentAt = new Date('2026-09-01T09:00:00Z');
        sentNotifications.push({
          userId,
          status: 'sent',
          sentAt,
          errorMessage: null,
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt,
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: 10, failed: 0, pending: 0 }),
    };

    // 入力データの構築
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // 関数実行
    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    // 期待値の計算
    // 期限までの残り時間: 09:30 - 09:00 = 30分
    const expectedRemainingTimeMinutes = 30;
    
    // 全部員（10名）に通知を送信
    const expectedSentCount = 10;
    const expectedFailedCount = 0;

    // 検証1: 関数の戻り値を確認
    expect(result.sentCount).toBe(expectedSentCount);
    expect(result.failedCount).toBe(expectedFailedCount);
    expect(result.remainingTimeMinutes).toBe(expectedRemainingTimeMinutes);

    // 検証2: notificationDetails の構造を確認
    expect(result.notificationDetails).toHaveLength(expectedSentCount);
    
    // 検証3: 各通知詳細の内容を確認
    result.notificationDetails.forEach((detail: ReminderNotificationDetail, index: number) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toEqual(new Date('2026-09-01T09:00:00Z'));
      expect(detail.errorMessage).toBeNull();
      expect(typeof detail.userId).toBe('string');
    });

    // 検証4: NotificationServiceAdapterのsendReminderNotificationが呼び出されたか確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.sendReminderNotification.mock.calls.length).toBe(expectedSentCount);

    // 検証5: 通知配信ログの確認（sentNotifications配列）
    expect(sentNotifications).toHaveLength(expectedSentCount);
    
    sentNotifications.forEach((record) => {
      expect(record.status).toBe('sent');
      expect(record.sentAt).toEqual(new Date('2026-09-01T09:00:00Z'));
      expect(record.errorMessage).toBeNull();
    });

    // 検証6: タイムスタンプが全て09:00:00であることを確認
    sentNotifications.forEach((record) => {
      const recordTime = record.sentAt?.toISOString();
      expect(recordTime).toBe('2026-09-01T09:00:00.000Z');
    });
  });
});