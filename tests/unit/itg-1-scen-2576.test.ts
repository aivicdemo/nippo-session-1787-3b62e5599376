import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder - Notification Deduplication Edge Case', () => {
  // SCEN-2576: [edge] リマインド通知自動送信機能 - 送信対象メンバーが全員同じユーザーIDの場合、そのユーザーへの通知数が重複数分となる
  test('should send duplicate notifications when all target members share the same user ID', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email' as const];

    const sendReminderNotificationCalls: Array<{
      userId: string;
      message: string;
      remainingMinutes: number;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(
        async (userId: string, message: string, remainingMinutes: number) => {
          sendReminderNotificationCalls.push({
            userId,
            message,
            remainingMinutes,
          });
          return {
            status: 'sent' as const,
            sentAt: new Date('2024-01-15T08:30:00Z'),
          };
        }
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockDatabaseAdapter = {
      getUnsubmittedMembersByTeamAndDate: jest.fn(async () => [
        {
          userId: 'user-001',
          userName: 'Member A',
          email: 'member-a@example.com',
          teamId: 'team-001',
          remainingMinutes: 30,
        },
        {
          userId: 'user-001',
          userName: 'Member A',
          email: 'member-a@example.com',
          teamId: 'team-001',
          remainingMinutes: 30,
        },
        {
          userId: 'user-001',
          userName: 'Member A',
          email: 'member-a@example.com',
          teamId: 'team-001',
          remainingMinutes: 30,
        },
      ]),
      recordReminderNotificationLog: jest.fn(async () => ({
        notificationId: 'notif-001',
        userId: 'user-001',
        sentAt: new Date('2024-01-15T08:30:00Z'),
      })),
    };

    const result = await sendDailyReportReminder(
      {
        scheduledTime,
        teamIds,
        reportDeadlineTime,
        notificationChannels,
      },
      mockNotificationServiceAdapter,
      mockDatabaseAdapter
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);
    expect(sendReminderNotificationCalls).toHaveLength(3);
    expect(sendReminderNotificationCalls[0].userId).toBe('user-001');
    expect(sendReminderNotificationCalls[1].userId).toBe('user-001');
    expect(sendReminderNotificationCalls[2].userId).toBe('user-001');

    expect(mockDatabaseAdapter.recordReminderNotificationLog).toHaveBeenCalledTimes(3);

    expect(result.sentCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(3);
    expect(result.notificationDetails[0].userId).toBe('user-001');
    expect(result.notificationDetails[0].status).toBe('sent');
    expect(result.notificationDetails[1].userId).toBe('user-001');
    expect(result.notificationDetails[1].status).toBe('sent');
    expect(result.notificationDetails[2].userId).toBe('user-001');
    expect(result.notificationDetails[2].status).toBe('sent');
  });
});