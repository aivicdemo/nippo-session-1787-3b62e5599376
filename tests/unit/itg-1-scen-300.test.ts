import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('リマインド通知自動送信機能', () => {
  // SCEN-300: [edge] リマインド通知自動送信機能 - 月末営業日（28日）の定時に通知が送信される
  test('月末営業日の定時に全メンバーへリマインド通知が送信され、配信ログに記録される', async () => {
    const scheduledTime = new Date('2026-08-28T10:00:00Z');
    const reportDeadlineTime = new Date('2026-08-28T18:00:00Z');
    const teamIds = ['team-001', 'team-002', 'team-003'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const mockNotificationDetails: ReminderNotificationDetail[] = [
      {
        userId: 'user-001',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-002',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-003',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-004',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-005',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-006',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-007',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-008',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-009',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
      {
        userId: 'user-010',
        status: 'sent',
        sentAt: new Date('2026-08-28T10:00:00Z'),
        errorMessage: null,
      },
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'sent' as const,
        deliveredAt: new Date('2026-08-28T10:00:00Z'),
      })),
      scheduleNotification: jest.fn(async () => ({
        scheduledId: 'sched-001',
        scheduledTime: new Date('2026-08-28T10:00:00Z'),
      })),
      getDeliveryStatus: jest.fn(async () => ({
        delivered: 10,
        failed: 0,
        pending: 0,
      })),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
    );

    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(480);
    expect(result.notificationDetails).toHaveLength(10);
    expect(result.notificationDetails.every((detail: ReminderNotificationDetail) => detail.status === 'sent')).toBe(true);
    expect(result.notificationDetails.every((detail: ReminderNotificationDetail) => detail.sentAt !== null && detail.sentAt !== undefined)).toBe(true);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);
    expect(mockNotificationServiceAdapter.scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduledTime: new Date('2026-08-28T10:00:00Z'),
        teamIds,
        reportDeadlineTime,
        notificationChannels,
      }),
    );

    const callArgs = mockNotificationServiceAdapter.sendReminderNotification.mock.calls;
    callArgs.forEach((args: any[]) => {
      expect(args[0]).toHaveProperty('userId');
      expect(args[0]).toHaveProperty('channels');
      expect(args[0].channels).toEqual(expect.arrayContaining(['email', 'slack']));
    });
  });
});