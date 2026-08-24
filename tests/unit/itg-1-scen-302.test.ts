import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-302
  test('年をまたぐ営業日（12月31日から1月1日）の定時に通知が正しく送信される', async () => {
    // Setup: Mock NotificationServiceAdapter
    const sentNotifications: Array<{
      userId: string;
      timestamp: Date;
      channel: 'email' | 'in_app' | 'slack';
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, timestamp: Date, channel: 'email' | 'in_app' | 'slack') => {
        sentNotifications.push({ userId, timestamp, channel });
        return { success: true, sentAt: timestamp };
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ delivered: true })),
    };

    // Team members for testing (10 members)
    const teamMemberIds = [
      'user-001', 'user-002', 'user-003', 'user-004', 'user-005',
      'user-006', 'user-007', 'user-008', 'user-009', 'user-010',
    ];

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2025-01-01T09:00:00+09:00'),
      teamIds: ['team-A'],
      reportDeadlineTime: new Date('2025-01-01T10:00:00+09:00'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Mock the team members lookup (simulate fetching from system)
    const mockTeamMembersMap: Record<string, string[]> = {
      'team-A': teamMemberIds,
    };

    // Execute: Call sendDailyReportReminder with mocked adapter
    const result = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockTeamMembersMap
    );

    // Verify: Check that all 10 team members received notifications
    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);

    // Verify: Check that notifications were sent to all team members
    expect(sentNotifications).toHaveLength(10);
    expect(sentNotifications.map(n => n.userId)).toEqual(expect.arrayContaining(teamMemberIds));

    // Verify: Check timestamp of all notifications
    const expectedTimestamp = new Date('2025-01-01T09:00:00+09:00');
    sentNotifications.forEach((notification) => {
      expect(notification.timestamp.getTime()).toBe(expectedTimestamp.getTime());
    });

    // Verify: Check notification details in output
    expect(result.notificationDetails).toHaveLength(10);
    result.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeDefined();
      expect(typeof detail.userId).toBe('string');
      expect(detail.errorMessage).toBeUndefined();
    });

    // Verify: Check remaining time to deadline
    const remainingTimeMs = expectedTimestamp.getTime() - new Date('2025-01-01T09:00:00+09:00').getTime();
    const expectedRemainingMinutes = Math.floor(remainingTimeMs / 60000) + 60; // 60 min until 10:00
    expect(result.remainingTimeMinutes).toBeGreaterThanOrEqual(59);
    expect(result.remainingTimeMinutes).toBeLessThanOrEqual(61);

    // Verify: Adapter methods were called correctly
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    // Verify: Year boundary handling - no duplicate or missed notifications
    const uniqueUserIds = new Set(sentNotifications.map(n => n.userId));
    expect(uniqueUserIds.size).toBe(10);
  });
});