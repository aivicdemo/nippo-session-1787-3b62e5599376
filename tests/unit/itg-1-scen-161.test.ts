import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - リマインド通知送信機能', () => {
  // SCEN-161: [edge] 報告期限時間表示機能 - 報告期限が24時間未満であるとき、小数点以下の時間も正しく計算される
  test('should calculate remaining time with millisecond precision when deadline is less than 24 hours away', () => {
    // 現在時刻を2026-08-20T08:00:00Zに固定
    const now = new Date('2026-08-20T08:00:00Z');
    const originalNow = Date.now;
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

    // 報告期限を2026-08-20T10:30:45.500Z（2時間30分45.5秒後）に設定
    const deadlineTime = new Date('2026-08-20T10:30:45.500Z');

    // NotificationServiceAdapterをスタブで初期化
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: now,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' as const }),
    };

    // 入力パラメータを準備
    const input: SendDailyReportReminderInput = {
      scheduledTime: now,
      teamIds: ['team-001'],
      reportDeadlineTime: deadlineTime,
      notificationChannels: ['email'],
    };

    // 報告期限表示機能の計算ロジックを実行
    const result = sendDailyReportReminder(input, notificationServiceAdapter);

    // 期限までの残り時間を計算（ミリ秒精度）
    // 差分: 2時間30分45.5秒 = 9045.5秒 = 150.758333...分
    const expectedRemainingMinutes = (deadlineTime.getTime() - now.getTime()) / (1000 * 60);

    // 期待値: 2時間30分45.5秒 = 150分45.5秒 = 150.758333...分
    const expectedMinutes = 150.758333333;

    // 小数点以下の時間値（ミリ秒）が正確に保持されていることを検証
    expect(result).toBeDefined();
    expect(result.remainingTimeMinutes).toBeCloseTo(expectedMinutes, 5);

    // 残り時間が2:30:45.500形式で表現可能であることを確認
    // 150.758333...分 = 2時間 + 30.758333...分 = 2時間 + 30分 + 45.5秒
    const hours = Math.floor(result.remainingTimeMinutes / 60);
    const remainingMinutesAfterHours = result.remainingTimeMinutes % 60;
    const minutes = Math.floor(remainingMinutesAfterHours);
    const seconds = (remainingMinutesAfterHours - minutes) * 60;

    expect(hours).toBe(2);
    expect(minutes).toBe(30);
    expect(seconds).toBeCloseTo(45.5, 1);

    // Date.nowのモックを復元
    jest.spyOn(Date, 'now').mockRestore();
  });
});