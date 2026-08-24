import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('detectAndNotifyUnsubmittedMembers - edge case: multiple unsubmitted members at same time', () => {
  test('SCEN-2876: sends reminder notifications to all unsubmitted members regardless of send order', async () => {
    // Setup: Mock NotificationServiceAdapter
    const notificationLogs: Array<{
      userId: string;
      sentAt: Date;
      status: 'sent' | 'failed';
      retryCount: number;
    }> = [];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        const sentAt = new Date('2024-01-15T09:00:00Z');
        notificationLogs.push({
          userId,
          sentAt,
          status: 'sent' as const,
          retryCount: 0,
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt,
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async () => ({})),
      getDeliveryStatus: jest.fn(async () => ({ status: 'sent' })),
    };

    // Setup: Initialize test data with three unsubmitted members at same time
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const unsubmittedMembers = [
      {
        userId: 'user-a',
        userName: 'Member A',
        email: 'member-a@example.com',
        remainingMinutes: 5,
      },
      {
        userId: 'user-b',
        userName: 'Member B',
        email: 'member-b@example.com',
        remainingMinutes: 5,
      },
      {
        userId: 'user-c',
        userName: 'Member C',
        email: 'member-c@example.com',
        remainingMinutes: 5,
      },
    ];

    // Execute: Call detectAndNotifyUnsubmittedMembers
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        unsubmittedMembers,
        executorUserId: 'executor-001',
      },
      mockNotificationAdapter
    );

    // Assert: sendReminderNotification called exactly 3 times
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);

    // Assert: Each user was called with correct userId
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenNthCalledWith(1, 'user-a');
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenNthCalledWith(2, 'user-b');
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenNthCalledWith(3, 'user-c');

    // Assert: Notification logs contain exactly 3 records
    expect(notificationLogs).toHaveLength(3);

    // Assert: All notifications have status "sent" and retryCount "0"
    notificationLogs.forEach((log) => {
      expect(log.status).toBe('sent');
      expect(log.retryCount).toBe(0);
      expect(log.sentAt).toEqual(new Date('2024-01-15T09:00:00Z'));
    });

    // Assert: All three members are in the logs
    const loggedUserIds = notificationLogs.map((log) => log.userId);
    expect(loggedUserIds).toContain('user-a');
    expect(loggedUserIds).toContain('user-b');
    expect(loggedUserIds).toContain('user-c');

    // Assert: Result indicates all notifications were sent
    expect(result.notificationsSent).toBe(3);
    expect(result.notificationFailures).toHaveLength(0);
    expect(result.executedAt).toBeTruthy();
  });
});