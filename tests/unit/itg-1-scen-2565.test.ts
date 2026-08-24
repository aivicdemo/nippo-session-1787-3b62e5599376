import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  test('SCEN-2565: [edge] リマインド通知自動送信機能 - 定時刻（9時00分00秒ちょうど）にリマインド通知が送信される', () => {
    // システム時刻を 2026年1月15日 08時59分59秒に設定
    const beforeScheduledTime = new Date('2026-01-15T08:59:59Z');
    jest.useFakeTimers();
    jest.setSystemTime(beforeScheduledTime);

    // NotificationServiceAdapter のスタブを準備し、呼び出し時刻を記録
    const callTimestamps: Date[] = [];
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        const callTime = new Date();
        callTimestamps.push(callTime);
        return { success: true, sentAt: callTime };
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'sent' })),
    };

    // リマインド通知送信の入力データを準備
    const scheduledTime = new Date('2026-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2026-01-15T09:30:00Z');
    const sendDailyReportReminderInput: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // システム時刻を 09時00分00秒ちょうどに進める
    jest.setSystemTime(scheduledTime);

    // sendDailyReportReminder を呼び出し
    const result = sendDailyReportReminder(
      sendDailyReportReminderInput,
      notificationServiceAdapterStub as any
    );

    // NotificationServiceAdapter の sendReminderNotification が呼び出されたことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalled();

    // 呼び出し時刻を検証：09時00分00秒±100ミリ秒以内
    expect(callTimestamps.length).toBeGreaterThan(0);
    const actualCallTime = callTimestamps[0].getTime();
    const expectedTime = new Date('2026-01-15T09:00:00Z').getTime();
    const timeDifference = Math.abs(actualCallTime - expectedTime);
    expect(timeDifference).toBeLessThanOrEqual(100);

    // リマインド通知送信の結果を検証
    expect(result).toHaveProperty('sentCount');
    expect(result).toHaveProperty('failedCount');
    expect(result).toHaveProperty('remainingTimeMinutes');
    expect(result).toHaveProperty('notificationDetails');

    // 残り時間の計算を検証：報告期限までの残り時間 = 30分
    const expectedRemainingMinutes = 30;
    expect(result.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    // 通知詳細情報の形式を検証
    expect(Array.isArray(result.notificationDetails)).toBe(true);
    result.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail).toHaveProperty('userId');
      expect(detail).toHaveProperty('status');
      expect(['sent', 'failed', 'skipped']).toContain(detail.status);
    });

    jest.useRealTimers();
  });
});