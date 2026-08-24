import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('リマインド通知自動送信機能', () => {
  // SCEN-2895
  test('[error] 未提出メンバーのユーザーIDが空のときリマインド通知が送信されない', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true, sentAt: new Date('2024-01-15T09:30:00Z') }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const unsubmittedMembersWithEmptyUserId = [
      {
        userId: '',
        userName: 'Member A',
        email: 'membera@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-002',
        userName: 'Member B',
        email: 'memberb@example.com',
        remainingMinutes: 30,
      },
    ];

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email'],
    };

    const result = sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      unsubmittedMembersWithEmptyUserId
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-002',
      }),
      expect.any(String),
      expect.any(Array)
    );

    expect(result).toEqual<SendDailyReportReminderOutput>({
      sentCount: 1,
      failedCount: 0,
      remainingTimeMinutes: 30,
      notificationDetails: expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-002',
          status: 'sent',
          sentAt: expect.any(Date),
          errorMessage: null,
        }),
        expect.objectContaining({
          userId: '',
          status: 'skipped',
          sentAt: null,
          errorMessage: expect.stringContaining('ユーザーID'),
        }),
      ]),
    });
  });
});