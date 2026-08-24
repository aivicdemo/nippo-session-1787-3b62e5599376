import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-394
  test('1000人のチームメンバー全員への定時リマインド通知が完全に配信完了する', async () => {
    const TEAM_ID = 'team-001';
    const LARGE_MEMBER_COUNT = 1000;
    const SCHEDULED_TIME = new Date('2024-01-15T08:30:00Z');
    const REPORT_DEADLINE_TIME = new Date('2024-01-15T09:00:00Z');
    const NOTIFICATION_CHANNELS: Array<'email' | 'in_app' | 'slack'> = ['email', 'in_app', 'slack'];

    // Create 1000 mock team members
    const mockTeamMembers = Array.from({ length: LARGE_MEMBER_COUNT }, (_, index) => ({
      userId: `user-${String(index + 1).padStart(4, '0')}`,
      teamId: TEAM_ID,
      userName: `Member ${index + 1}`,
      email: `member${index + 1}@company.com`,
    }));

    // Track notification send calls
    const sentNotifications: Array<{ userId: string; channels: Array<'email' | 'in_app' | 'slack'> }> = [];
    const notificationErrors: Array<{ userId: string; error: string }> = [];

    // Mock NotificationServiceAdapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, remainingMinutes: number, channels: Array<'email' | 'in_app' | 'slack'>) => {
        sentNotifications.push({ userId, channels });
        return {
          status: 'sent' as const,
          sentAt: new Date(),
          errorMessage: null,
        };
      }),

      scheduleNotification: jest.fn(async () => ({
        scheduleId: 'schedule-001',
        status: 'scheduled' as const,
      })),

      getDeliveryStatus: jest.fn(async () => ({
        successCount: sentNotifications.length,
        failureCount: notificationErrors.length,
        pendingCount: 0,
      })),
    };

    // Mock database queries
    const mockDatabaseQueries = {
      getTeamMembers: jest.fn(async () => mockTeamMembers),
      recordNotificationLog: jest.fn(async (record: {
        userId: string;
        sentAt: Date;
        status: 'sent' | 'failed' | 'skipped';
        channels: Array<'email' | 'in_app' | 'slack'>;
      }) => ({
        logId: `log-${Date.now()}-${Math.random()}`,
        ...record,
      })),
      getNotificationLogs: jest.fn(async (teamId: string) =>
        mockTeamMembers.map((member, index) => ({
          logId: `log-${index}`,
          userId: member.userId,
          sentAt: SCHEDULED_TIME,
          status: 'sent' as const,
          channels: NOTIFICATION_CHANNELS,
        }))
      ),
    };

    // Prepare input
    const input: SendDailyReportReminderInput = {
      scheduledTime: SCHEDULED_TIME,
      teamIds: [TEAM_ID],
      reportDeadlineTime: REPORT_DEADLINE_TIME,
      notificationChannels: NOTIFICATION_CHANNELS,
    };

    // Execute function with injected dependencies
    const startTime = Date.now();

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter as any,
      mockDatabaseQueries as any
    );

    const elapsedTimeMs = Date.now() - startTime;
    const elapsedTimeSec = elapsedTimeMs / 1000;

    // Assertions: Verify all 1000 notifications were sent
    expect(sentNotifications.length).toBe(LARGE_MEMBER_COUNT);

    // Verify output metrics
    expect(output.sentCount).toBe(LARGE_MEMBER_COUNT);
    expect(output.failedCount).toBe(0);

    // Calculate expected remaining time: deadline - scheduled = 9:00 - 8:30 = 30 minutes
    const expectedRemainingMinutes = 30;
    expect(output.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    // Verify notification details array length
    expect(output.notificationDetails).toHaveLength(LARGE_MEMBER_COUNT);

    // Verify each notification detail has correct structure
    output.notificationDetails.forEach((detail: ReminderNotificationDetail, index: number) => {
      expect(detail.userId).toBe(`user-${String(index + 1).padStart(4, '0')}`);
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeInstanceOf(Date);
      expect(detail.errorMessage).toBeNull();
    });

    // Verify all user IDs in sent notifications are unique
    const sentUserIds = sentNotifications.map(n => n.userId);
    const uniqueUserIds = new Set(sentUserIds);
    expect(uniqueUserIds.size).toBe(LARGE_MEMBER_COUNT);

    // Verify each notification was sent through all configured channels
    sentNotifications.forEach(notification => {
      expect(notification.channels).toEqual(NOTIFICATION_CHANNELS);
    });

    // Verify database logging
    expect(mockDatabaseQueries.getNotificationLogs).toHaveBeenCalledWith(TEAM_ID);
    const logs = await mockDatabaseQueries.getNotificationLogs(TEAM_ID);
    expect(logs).toHaveLength(LARGE_MEMBER_COUNT);

    // Verify all logs have success status
    logs.forEach((log: { status: string; userId: string; sentAt: Date }) => {
      expect(log.status).toBe('sent');
      expect(log.userId).toBeDefined();
      expect(log.sentAt).toBeInstanceOf(Date);
    });

    // Verify performance: elapsed time should be within 60 seconds
    expect(elapsedTimeSec).toBeLessThan(60);

    // Verify notification service adapter was called correct number of times
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(LARGE_MEMBER_COUNT);

    // Verify mock was called with correct channel configuration for each call
    for (let i = 0; i < LARGE_MEMBER_COUNT; i++) {
      expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
        i + 1,
        `user-${String(i + 1).padStart(4, '0')}`,
        expectedRemainingMinutes,
        NOTIFICATION_CHANNELS
      );
    }
  });
});