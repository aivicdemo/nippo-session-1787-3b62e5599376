import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - notification disabled users', () => {
  // SCEN-2563
  test('should skip sending reminder notification when user notification setting is disabled', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:30Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sentCount: 1,
        failedCount: 0,
      }),
    };

    const mockNotificationDisabledUserA = {
      userId: 'user-a-disabled',
      userName: 'User A Disabled',
      email: 'user-a-disabled@example.com',
      notificationEnabled: false,
    };

    const mockNotificationEnabledUserB = {
      userId: 'user-b-enabled',
      userName: 'User B Enabled',
      email: 'user-b-enabled@example.com',
      notificationEnabled: true,
    };

    const mockUserRepository = {
      getTeamMembers: jest.fn().mockResolvedValue([
        mockNotificationDisabledUserA,
        mockNotificationEnabledUserB,
      ]),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockUserRepository,
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-b-enabled',
      }),
      expect.any(Object),
    );

    const notificationDetailsForUserA = output.notificationDetails.find(
      (detail: ReminderNotificationDetail) => detail.userId === 'user-a-disabled',
    );
    const notificationDetailsForUserB = output.notificationDetails.find(
      (detail: ReminderNotificationDetail) => detail.userId === 'user-b-enabled',
    );

    expect(notificationDetailsForUserA).toBeDefined();
    expect(notificationDetailsForUserA?.status).toBe('skipped');
    expect(notificationDetailsForUserA?.sentAt).toBeNull();
    expect(notificationDetailsForUserA?.errorMessage).toContain('notification_disabled');

    expect(notificationDetailsForUserB).toBeDefined();
    expect(notificationDetailsForUserB?.status).toBe('sent');
    expect(notificationDetailsForUserB?.sentAt).toBeDefined();

    expect(output.sentCount).toBe(1);
    expect(output.failedCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(30);
  });
});