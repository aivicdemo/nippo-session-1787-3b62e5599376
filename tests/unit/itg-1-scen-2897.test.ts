import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-2897
  test('リマインド対象日時が空のときリマインド通知が送信されない', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'pending',
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T09:00:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:30:00Z'),
      notificationChannels: ['email', 'in_app'],
    };

    const mockTeamMembers = [
      {
        userId: 'user-001',
        userName: 'John Doe',
        email: 'john@example.com',
        reminderScheduledDateTime: null,
        teamId: 'team-001',
      },
    ];

    const mockGetTeamMembers = jest
      .fn()
      .mockResolvedValue(mockTeamMembers);

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockGetTeamMembers
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    expect(output.sentCount).toBe(0);
    expect(output.failedCount).toBe(0);
    expect(output.notificationDetails).toHaveLength(0);

    const notificationLogs = output.notificationDetails.filter(
      (detail) => detail.userId === 'user-001'
    );
    expect(notificationLogs).toHaveLength(0);
  });
});