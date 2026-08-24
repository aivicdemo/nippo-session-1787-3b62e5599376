import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder - Null UserId Handling', () => {
  // SCEN-287
  test('should fail gracefully when team member userId is null and record failure status', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string | null, message: string, channels: string[]) => {
        if (userId === null || userId === undefined) {
          return {
            userId,
            status: 'failed' as const,
            sentAt: null,
            errorMessage: 'INVALID_USER_ID'
          };
        }
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:31:00Z'),
          errorMessage: null
        };
      })
    };

    const mockTeamMembersData = [
      {
        userId: 'user-001',
        userName: 'Alice',
        email: 'alice@example.com',
        teamId: 'team-001'
      },
      {
        userId: null,
        userName: 'Bob',
        email: 'bob@example.com',
        teamId: 'team-001'
      },
      {
        userId: 'user-003',
        userName: 'Charlie',
        email: 'charlie@example.com',
        teamId: 'team-001'
      }
    ];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter as any
    );

    expect(result.sentCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.remainingTimeMinutes).toBe(30);

    const nullUserNotification = result.notificationDetails.find(
      (detail: ReminderNotificationDetail) => detail.userId === null
    );
    expect(nullUserNotification).toBeDefined();
    expect(nullUserNotification?.status).toBe('failed');
    expect(nullUserNotification?.sentAt).toBeNull();
    expect(nullUserNotification?.errorMessage).toBe('INVALID_USER_ID');

    const successfulNotifications = result.notificationDetails.filter(
      (detail: ReminderNotificationDetail) => detail.status === 'sent'
    );
    expect(successfulNotifications.length).toBe(2);
    expect(successfulNotifications[0].userId).toBe('user-001');
    expect(successfulNotifications[1].userId).toBe('user-003');

    successfulNotifications.forEach((notification: ReminderNotificationDetail) => {
      expect(notification.sentAt).toBeDefined();
      expect(notification.errorMessage).toBeNull();
    });

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);
  });
});