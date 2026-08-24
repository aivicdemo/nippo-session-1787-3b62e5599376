import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder', () => {
  // SCEN-276
  test('should send reminder notifications to all 10 registered team members and record delivery logs', async () => {
    // Setup: Mock NotificationServiceAdapter
    const notificationLogs: Array<{
      userId: string;
      status: 'sent' | 'failed' | 'skipped';
      sentAt: Date | null;
      errorMessage: string | null;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        notificationLogs.push({
          userId,
          status: 'sent',
          sentAt: new Date('2024-01-15T08:30:00Z'),
          errorMessage: null,
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:30:00Z'),
          errorMessage: null,
        };
      }),
    };

    // Prepare input
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Mock team members data (10 members)
    const teamMembers = [
      { userId: 'user-001', userName: 'Alice', email: 'alice@example.com' },
      { userId: 'user-002', userName: 'Bob', email: 'bob@example.com' },
      { userId: 'user-003', userName: 'Charlie', email: 'charlie@example.com' },
      { userId: 'user-004', userName: 'David', email: 'david@example.com' },
      { userId: 'user-005', userName: 'Eve', email: 'eve@example.com' },
      { userId: 'user-006', userName: 'Frank', email: 'frank@example.com' },
      { userId: 'user-007', userName: 'Grace', email: 'grace@example.com' },
      { userId: 'user-008', userName: 'Henry', email: 'henry@example.com' },
      { userId: 'user-009', userName: 'Iris', email: 'iris@example.com' },
      { userId: 'user-010', userName: 'Jack', email: 'jack@example.com' },
    ];

    // Execute
    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter as any,
      async () => teamMembers,
    );

    // Assertions
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    // Verify all team members were called
    const calledUserIds = mockNotificationServiceAdapter.sendReminderNotification.mock.calls.map(
      (call) => call[0],
    );
    expect(calledUserIds).toContain('user-001');
    expect(calledUserIds).toContain('user-002');
    expect(calledUserIds).toContain('user-003');
    expect(calledUserIds).toContain('user-004');
    expect(calledUserIds).toContain('user-005');
    expect(calledUserIds).toContain('user-006');
    expect(calledUserIds).toContain('user-007');
    expect(calledUserIds).toContain('user-008');
    expect(calledUserIds).toContain('user-009');
    expect(calledUserIds).toContain('user-010');

    // Verify notification logs
    expect(notificationLogs).toHaveLength(10);
    expect(notificationLogs.every((log) => log.status === 'sent')).toBe(true);
    expect(notificationLogs.every((log) => log.sentAt !== null)).toBe(true);

    // Verify output
    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(10);
    expect(
      result.notificationDetails.every((detail) => detail.status === 'sent'),
    ).toBe(true);
  });
});