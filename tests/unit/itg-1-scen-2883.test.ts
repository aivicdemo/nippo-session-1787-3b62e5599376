import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification Feature', () => {
  // SCEN-2883: リマインド通知自動送信機能 - 朝会開始30分前に到達したとき、未提出メンバーが複数件の場合にリマインド通知が全員分送信される
  test('should send reminder notifications to all unsubmitted members 30 minutes before morning meeting start time', async () => {
    // Setup: Mock NotificationServiceAdapter
    const notificationLog: Array<{
      userId: string;
      status: 'sent' | 'failed' | 'skipped';
      sentAt: Date | null;
      errorMessage: string | null;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, timestamp: Date) => {
        notificationLog.push({
          userId,
          status: 'sent',
          sentAt: timestamp,
          errorMessage: null,
        });
        return { success: true, userId, sentAt: timestamp };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Setup: Define test data
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    // Setup: 5 unsubmitted members registered
    const unsubmittedMembers = [
      { userId: 'user-001', userName: 'Member A', email: 'member-a@example.com', remainingMinutes: 30 },
      { userId: 'user-002', userName: 'Member B', email: 'member-b@example.com', remainingMinutes: 30 },
      { userId: 'user-003', userName: 'Member C', email: 'member-c@example.com', remainingMinutes: 30 },
      { userId: 'user-004', userName: 'Member D', email: 'member-d@example.com', remainingMinutes: 30 },
      { userId: 'user-005', userName: 'Member E', email: 'member-e@example.com', remainingMinutes: 30 },
    ];

    // Create input
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Execute: Call sendDailyReportReminder with mock adapter
    const output = await sendDailyReportReminder(input, mockNotificationServiceAdapter, unsubmittedMembers);

    // Verify: All 5 unsubmitted members received notifications
    expect(output.sentCount).toBe(5);
    expect(output.failedCount).toBe(0);

    // Verify: Remaining time to deadline is correct (30 minutes)
    expect(output.remainingTimeMinutes).toBe(30);

    // Verify: sendReminderNotification was called exactly 5 times (once per unsubmitted member)
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(5);

    // Verify: Each call contains correct user IDs
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      1,
      'user-001',
      expect.any(String),
      expect.any(Date),
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      2,
      'user-002',
      expect.any(String),
      expect.any(Date),
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      3,
      'user-003',
      expect.any(String),
      expect.any(Date),
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      4,
      'user-004',
      expect.any(String),
      expect.any(Date),
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      5,
      'user-005',
      expect.any(String),
      expect.any(Date),
    );

    // Verify: Notification log contains 5 entries
    expect(notificationLog).toHaveLength(5);

    // Verify: All log entries have successful status
    notificationLog.forEach((entry) => {
      expect(entry.status).toBe('sent');
      expect(entry.sentAt).toBeInstanceOf(Date);
      expect(entry.errorMessage).toBeNull();
    });

    // Verify: All expected user IDs are in the log
    const loggedUserIds = notificationLog.map((entry) => entry.userId);
    expect(loggedUserIds).toEqual(
      expect.arrayContaining(['user-001', 'user-002', 'user-003', 'user-004', 'user-005']),
    );

    // Verify: notificationDetails array matches logged notifications
    expect(output.notificationDetails).toHaveLength(5);

    // Verify: Each notification detail has correct structure
    output.notificationDetails.forEach((detail: ReminderNotificationDetail, index: number) => {
      expect(detail.userId).toBe(unsubmittedMembers[index].userId);
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeInstanceOf(Date);
      expect(detail.errorMessage).toBeNull();
    });
  });
});