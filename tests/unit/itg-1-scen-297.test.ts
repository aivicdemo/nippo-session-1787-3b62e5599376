import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

// Mock NotificationServiceAdapter
interface MockNotificationAdapter {
  sendReminderNotification: jest.Mock;
  scheduleNotification: jest.Mock;
  getDeliveryStatus: jest.Mock;
}

describe('sendDailyReportReminder - 定時リマインド通知自動送信', () => {
  let mockAdapter: MockNotificationAdapter;
  let originalNow: typeof Date.now;
  const baselineTime = new Date('2026-08-19T08:29:59.000Z').getTime();
  const triggerTime = new Date('2026-08-19T08:30:01.000Z').getTime();

  beforeEach(() => {
    // SCEN-297: リマインド通知自動送信機能のテスト
    // 時刻をモック化: 定時 08:30:01 に設定
    originalNow = Date.now;
    Date.now = jest.fn(() => triggerTime);

    // NotificationServiceAdapter をモック化
    mockAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, remainingMinutes: number) => ({
        status: 'sent' as const,
        sentAt: new Date(triggerTime),
        userId,
      })),
      scheduleNotification: jest.fn(async () => undefined),
      getDeliveryStatus: jest.fn(async () => ({ delivered: true })),
    };
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  test('SCEN-297: 定時8時30分の1秒後に登録済みチームメンバー全員にリマインド通知が送信される', async () => {
    // 事前登録: チームメンバー10名分のユーザーデータ
    const registeredUserIds = [
      'user-001', 'user-002', 'user-003', 'user-004', 'user-005',
      'user-006', 'user-007', 'user-008', 'user-009', 'user-010',
    ];

    // 入力パラメータ: 定時スケジュール時刻と報告期限時刻
    const scheduledTime = new Date('2026-08-19T08:30:00.000Z');
    const reportDeadlineTime = new Date('2026-08-19T09:00:00.000Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['slack', 'in_app'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // 関数呼び出し: リマインド通知送信を実行
    const output = await sendDailyReportReminder(input, mockAdapter);

    // 検証 1: システム時刻が 08:30:01 であることを確認
    expect(Date.now()).toBe(triggerTime);

    // 検証 2: 報告期限までの残り時間を計算
    // 08:30:01 から 09:00:00 までは 29分59秒 ≈ 29.98分
    const expectedRemainingMinutes = Math.floor(
      (reportDeadlineTime.getTime() - triggerTime) / (1000 * 60)
    );
    expect(expectedRemainingMinutes).toBe(29);

    // 検証 3: sendReminderNotification が正確に呼び出された
    // チームメンバー全員（10名）分の呼び出しが必要
    expect(mockAdapter.sendReminderNotification).toHaveBeenCalled();

    // 検証 4: 呼び出し回数がチームメンバー数と一致
    const callCount = mockAdapter.sendReminderNotification.mock.calls.length;
    expect(callCount).toBe(registeredUserIds.length);

    // 検証 5: 各呼び出しで登録済みメンバーのユーザーIDが含まれていること
    const calledUserIds: string[] = [];
    mockAdapter.sendReminderNotification.mock.calls.forEach((call) => {
      const [userId, remainingMinutes] = call;
      calledUserIds.push(userId);
      // 残り時間が期待値に近い値であること
      expect(remainingMinutes).toBe(expectedRemainingMinutes);
    });

    // 検証 6: 呼び出されたユーザーIDが全員分一致
    expect(calledUserIds.sort()).toEqual(registeredUserIds.sort());

    // 検証 7: SendDailyReportReminderOutput の検証
    expect(output).toHaveProperty('sentCount');
    expect(output).toHaveProperty('failedCount');
    expect(output).toHaveProperty('remainingTimeMinutes');
    expect(output).toHaveProperty('notificationDetails');

    // 検証 8: 出力値の具体的な検証
    expect(output.sentCount).toBeGreaterThanOrEqual(0);
    expect(output.failedCount).toBeGreaterThanOrEqual(0);
    expect(output.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    // 検証 9: 通知詳細情報が配列で返されていること
    expect(Array.isArray(output.notificationDetails)).toBe(true);

    // 検証 10: 各通知詳細に必須フィールドが含まれていること
    output.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail).toHaveProperty('userId');
      expect(detail).toHaveProperty('status');
      expect(['sent', 'failed', 'skipped']).toContain(detail.status);
    });
  });
});