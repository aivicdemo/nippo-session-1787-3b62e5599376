import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification', () => {
  // SCEN-290: [error] 朝会報告リマインド通知自動送信機能 - チームメンバーの連絡先情報が空文字のとき該当メンバーへの通知送信が失敗する
  test('should fail to send reminder when member contact info is empty string and record failure in notification log', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];

    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Mock responses for members A through J
    // Member A has empty contact info - will fail
    notificationServiceAdapter.sendReminderNotification.mockImplementation(
      async (userId: string, email: string) => {
        if (userId === 'member-A' && email === '') {
          return {
            userId: 'member-A',
            status: 'failed' as const,
            sentAt: null,
            errorMessage: 'invalid contact information',
          };
        }
        // Members B through J succeed
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:30:30Z'),
          errorMessage: null,
        };
      }
    );

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Team members: A (empty contact) and B-J (valid)
    const teamMembers = [
      { userId: 'member-A', email: '', name: 'Alice' },
      { userId: 'member-B', email: 'bob@example.com', name: 'Bob' },
      { userId: 'member-C', email: 'charlie@example.com', name: 'Charlie' },
      { userId: 'member-D', email: 'david@example.com', name: 'David' },
      { userId: 'member-E', email: 'emma@example.com', name: 'Emma' },
      { userId: 'member-F', email: 'frank@example.com', name: 'Frank' },
      { userId: 'member-G', email: 'grace@example.com', name: 'Grace' },
      { userId: 'member-H', email: 'henry@example.com', name: 'Henry' },
      { userId: 'member-I', email: 'iris@example.com', name: 'Iris' },
      { userId: 'member-J', email: 'jack@example.com', name: 'Jack' },
    ];

    // Execute the function with injected adapter and team members
    const output = await sendDailyReportReminder(
      input,
      notificationServiceAdapter,
      teamMembers
    );

    // Verify member A's notification failed
    expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'member-A',
      ''
    );

    // Verify members B-J had notifications attempted
    expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'member-B',
      'bob@example.com'
    );
    expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'member-J',
      'jack@example.com'
    );

    // Verify output structure and values
    expect(output).toEqual(
      expect.objectContaining({
        sentCount: 9,
        failedCount: 1,
        remainingTimeMinutes: 30,
        notificationDetails: expect.arrayContaining([
          expect.objectContaining({
            userId: 'member-A',
            status: 'failed',
            sentAt: null,
            errorMessage: 'invalid contact information',
          }),
        ]),
      })
    );

    // Verify member A failure is recorded in notification details
    const memberADetail = output.notificationDetails.find(
      (detail: ReminderNotificationDetail) => detail.userId === 'member-A'
    );
    expect(memberADetail).toEqual({
      userId: 'member-A',
      status: 'failed',
      sentAt: null,
      errorMessage: 'invalid contact information',
    });

    // Verify at least one successful notification exists (e.g., member B)
    const memberBDetail = output.notificationDetails.find(
      (detail: ReminderNotificationDetail) => detail.userId === 'member-B'
    );
    expect(memberBDetail).toEqual(
      expect.objectContaining({
        userId: 'member-B',
        status: 'sent',
        sentAt: expect.any(Date),
        errorMessage: null,
      })
    );

    // Verify total notification details count
    expect(output.notificationDetails).toHaveLength(10);

    // Verify failed count reflects the one failure
    expect(output.failedCount).toBe(1);

    // Verify sent count reflects successful notifications
    expect(output.sentCount).toBe(9);
  });
});