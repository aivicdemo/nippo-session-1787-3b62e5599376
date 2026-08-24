import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification', () => {
  // SCEN-1029: [normal] リマインド通知機能 - 複数のチームメンバーへ毎朝定時にリマインド通知が送信される
  test('should send reminder notifications to all team members at scheduled time', async () => {
    // Setup: Create mock notification service adapter
    const notificationLogs: Array<{
      userId: string;
      sentAt: Date;
      status: 'sent' | 'failed' | 'skipped';
    }> = [];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(
        async (userId: string, message: string, channels: string[]) => {
          const sentAt = new Date('2024-01-15T09:00:00+09:00');
          notificationLogs.push({
            userId,
            sentAt,
            status: 'sent',
          });
          return {
            userId,
            status: 'sent' as const,
            sentAt,
            errorMessage: null,
          };
        }
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Prepare test data: 10 team members
    const teamMembers = Array.from({ length: 10 }, (_, i) => ({
      userId: `user_${String(i + 1).padStart(2, '0')}`,
      userName: `Member ${i + 1}`,
      email: `member${i + 1}@example.com`,
    }));

    const scheduledTime = new Date('2024-01-15T09:00:00+09:00');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00+09:00');
    const teamIds = ['team_001'];
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email', 'slack'];

    // Construct input
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Execute function with mocked adapter
    const result = await sendDailyReportReminder(input, mockNotificationAdapter);

    // Validate: Ensure sendReminderNotification was called for all 10 members
    // (In real scenario, the function would iterate through team members and call the adapter)
    // For this test, we simulate the expected behavior

    // Expected output structure
    expect(result).toHaveProperty('sentCount');
    expect(result).toHaveProperty('failedCount');
    expect(result).toHaveProperty('remainingTimeMinutes');
    expect(result).toHaveProperty('notificationDetails');

    // Validate sent count (10 members)
    expect(result.sentCount).toBe(10);

    // Validate failed count (0 in happy path)
    expect(result.failedCount).toBe(0);

    // Validate remaining time: from 09:00 to 09:30 = 30 minutes
    expect(result.remainingTimeMinutes).toBe(30);

    // Validate notification details array has 10 entries
    expect(result.notificationDetails).toHaveLength(10);

    // Validate each notification detail
    result.notificationDetails.forEach((detail: ReminderNotificationDetail, index: number) => {
      expect(detail.userId).toBe(`user_${String(index + 1).padStart(2, '0')}`);
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeDefined();
      expect(detail.errorMessage).toBeNull();
    });

    // Validate notification logs have 10 entries (one per member)
    expect(notificationLogs).toHaveLength(10);

    // Verify all log entries have 'sent' status
    notificationLogs.forEach((log) => {
      expect(log.status).toBe('sent');
      expect(log.sentAt).toEqual(new Date('2024-01-15T09:00:00+09:00'));
    });

    // Verify adapter was called with correct parameters for each member
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    // Verify the mock was called with expected channel configuration
    mockNotificationAdapter.sendReminderNotification.mock.calls.forEach((call) => {
      const [userId, message, channels] = call;
      expect(userId).toMatch(/^user_\d{2}$/);
      expect(message).toContain('朝会報告');
      expect(channels).toEqual(expect.arrayContaining(['email', 'slack']));
    });
  });
});