import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  test('SCEN-369: リマインド通知に報告期限までの残り時間が正確に表示される', async () => {
    // リマインド通知ペイロードをキャプチャするためのスタブ
    const sentNotifications: Array<{
      userId: string;
      remainingTimeMinutes: number;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, remainingMinutes: number) => {
        sentNotifications.push({
          userId,
          remainingTimeMinutes: remainingMinutes,
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date(),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // 時刻をモック固定（08:30）
    const mockDate1 = new Date('2024-01-15T08:30:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockDate1);

    // テスト入力：定時スケジュール時刻、対象チーム、報告期限（本日09:00）
    const input1: Parameters<typeof sendDailyReportReminder>[0] = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email'],
    };

    // 1回目の実行
    const result1 = await sendDailyReportReminder(input1, mockNotificationServiceAdapter as any);

    // 1回目のリマインド送信結果を検証
    expect(result1.remainingTimeMinutes).toBe(30);
    expect(sentNotifications.length).toBe(1);
    expect(sentNotifications[0].remainingTimeMinutes).toBe(30);

    // 時刻を08:45に進める
    const mockDate2 = new Date('2024-01-15T08:45:00Z');
    jest.setSystemTime(mockDate2);

    // テスト入力：時刻を08:45に進めた状態での再実行
    const input2: Parameters<typeof sendDailyReportReminder>[0] = {
      scheduledTime: new Date('2024-01-15T08:45:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email'],
    };

    // 2回目の実行
    const result2 = await sendDailyReportReminder(input2, mockNotificationServiceAdapter as any);

    // 2回目のリマインド送信結果を検証
    expect(result2.remainingTimeMinutes).toBe(15);
    expect(sentNotifications.length).toBe(2);
    expect(sentNotifications[1].remainingTimeMinutes).toBe(15);

    // クリーンアップ
    jest.useRealTimers();
  });
});