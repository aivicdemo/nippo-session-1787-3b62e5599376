import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能 - 無効・削除済みメンバー処理', () => {
  // SCEN-384
  test('登録状態が無効または削除済みのメンバーに対してリマインド送信が中断される', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const sendReminderNotificationLog: Array<{ userId: string; status: string }> = [];
    const skipLog: Array<{ userId: string; reason: string }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: async (userId: string, remainingMinutes: number) => {
        sendReminderNotificationLog.push({ userId, status: 'sent' });
        return { sentAt: new Date('2024-01-15T09:00:00Z'), errorMessage: null };
      },
      scheduleNotification: async () => {},
      getDeliveryStatus: async () => ({ status: 'success' }),
      logSkippedUser: (userId: string, reason: string) => {
        skipLog.push({ userId, reason });
      },
    };

    const mockUserRepository = {
      findActiveUsersByTeamId: async (teamId: string) => [
        { userId: 'user-001', status: 'active', email: 'user001@example.com' },
        { userId: 'user-002', status: 'active', email: 'user002@example.com' },
        { userId: 'user-003', status: 'active', email: 'user003@example.com' },
        { userId: 'user-004', status: 'active', email: 'user004@example.com' },
        { userId: 'user-005', status: 'active', email: 'user005@example.com' },
        { userId: 'user-006', status: 'active', email: 'user006@example.com' },
        { userId: 'user-007', status: 'active', email: 'user007@example.com' },
        { userId: 'user-008', status: 'inactive', email: 'user008@example.com' },
        { userId: 'user-009', status: 'inactive', email: 'user009@example.com' },
        { userId: 'user-010', status: 'inactive', email: 'user010@example.com' },
      ],
      findDeletedUsersByTeamId: async (teamId: string) => [
        { userId: 'user-011', email: 'user011@example.com', deletedAt: new Date('2024-01-10T00:00:00Z') },
        { userId: 'user-012', email: 'user012@example.com', deletedAt: new Date('2024-01-12T00:00:00Z') },
      ],
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter, mockUserRepository);

    expect(result.sentCount).toBe(7);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(60);

    expect(sendReminderNotificationLog).toHaveLength(7);
    const sentUserIds = sendReminderNotificationLog.map(log => log.userId);
    expect(sentUserIds).toEqual([
      'user-001',
      'user-002',
      'user-003',
      'user-004',
      'user-005',
      'user-006',
      'user-007',
    ]);

    expect(skipLog).toHaveLength(5);
    const inactiveSkips = skipLog.filter(log => log.reason === 'inactive');
    const deletedSkips = skipLog.filter(log => log.reason === 'deleted');

    expect(inactiveSkips).toHaveLength(3);
    expect(deletedSkips).toHaveLength(2);

    expect(result.notificationDetails).toHaveLength(7);
    result.notificationDetails.forEach(detail => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeDefined();
      expect(detail.errorMessage).toBeNull();
    });
  });
});