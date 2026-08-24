import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - 提出済みユーザーへの通知スキップ', () => {
  // SCEN-2564
  test('未提出ユーザーのみにリマインド通知を送信し、提出済みユーザーへは送信しない', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const mockNotificationLog: Array<{
      userId: string;
      sentAt: Date | null;
      status: 'sent' | 'failed' | 'skipped';
      errorMessage: string | null;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        mockNotificationLog.push({
          userId,
          sentAt: new Date('2024-01-15T08:30:15Z'),
          status: 'sent',
          errorMessage: null,
        });
        return { success: true };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter as any,
      [
        {
          userId: 'user-a',
          userName: 'User A',
          email: 'user-a@example.com',
          hasSubmitted: true,
          submissionTimestamp: new Date('2024-01-15T08:00:00Z'),
        },
        {
          userId: 'user-b',
          userName: 'User B',
          email: 'user-b@example.com',
          hasSubmitted: true,
          submissionTimestamp: new Date('2024-01-15T08:15:00Z'),
        },
        {
          userId: 'user-c',
          userName: 'User C',
          email: 'user-c@example.com',
          hasSubmitted: false,
          submissionTimestamp: null,
        },
      ]
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'user-c',
      expect.stringContaining('残り時間'),
      ['email', 'in_app', 'slack']
    );
    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(1);
    expect(result.notificationDetails[0]).toEqual(
      expect.objectContaining({
        userId: 'user-c',
        status: 'sent',
        sentAt: expect.any(Date),
        errorMessage: null,
      })
    );
    expect(mockNotificationLog).toHaveLength(1);
    expect(mockNotificationLog[0].userId).toBe('user-c');
    expect(mockNotificationLog[0].status).toBe('sent');
  });
});