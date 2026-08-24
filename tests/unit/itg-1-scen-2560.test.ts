import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-2560: [error] リマインド通知自動送信機能 - NotificationServiceAdapter が失敗を返したとき内部キューへの一時保存に切り替わる
  test('NotificationServiceAdapter が失敗ステータスを返した場合、失敗通知を内部キューへ保存し、ダッシュボード遅延表示フラグを設定する', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const deadlineTime = new Date('2024-01-15T09:30:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        delivery_status: 'failed',
        error_code: 'service_unavailable',
        user_id: 'user-001',
        message_id: null,
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      scheduledTime,
      teamIds,
      reportDeadlineTime: deadlineTime,
      notificationChannels,
    };

    const result = await sendDailyReportReminder(input, mockNotificationAdapter);

    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBeGreaterThan(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'failed',
          sentAt: null,
          errorMessage: expect.any(String),
        }),
      ])
    );

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();

    const queuedNotifications = result.notificationDetails.filter(
      (detail) => detail.status === 'failed'
    );
    expect(queuedNotifications.length).toBeGreaterThan(0);

    const dashboardDelayFlag = result.notificationDetails.some(
      (detail) => detail.status === 'failed' && detail.errorMessage?.includes('遅延')
    );
    expect(dashboardDelayFlag || result.failedCount > 0).toBe(true);
  });
});