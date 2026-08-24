import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder - Empty UserID Failure', () => {
  // SCEN-288
  test('should record failed notification when user ID is empty string and continue sending to valid members', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app'] as const;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        if (userId === '') {
          return {
            success: false,
            error: 'INVALID_USER_ID',
            userId: '',
            sentAt: null,
          };
        }
        return {
          success: true,
          userId: userId,
          sentAt: new Date('2024-01-15T08:30:15Z'),
        };
      }),
    };

    const mockTeamRepository = {
      findTeamById: jest.fn(async (teamId: string) => ({
        teamId: teamId,
        teamName: 'Development Team',
      })),
      getTeamMembersByTeamId: jest.fn(async (teamId: string) => [
        {
          userId: '',
          userName: 'Invalid User',
          email: 'invalid@example.com',
        },
        {
          userId: 'user-002',
          userName: 'Valid User',
          email: 'valid@example.com',
        },
      ]),
    };

    const mockNotificationLogRepository = {
      recordNotificationAttempt: jest.fn(async (record: {
        userId: string;
        status: 'sent' | 'failed' | 'skipped';
        sentAt: Date | null;
        errorMessage: string | null;
      }) => {
        return {
          notificationLogId: 'log-' + Math.random().toString(36),
          ...record,
          recordedAt: new Date('2024-01-15T08:30:15Z'),
        };
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime,
      teamIds: teamIds,
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: notificationChannels,
    };

    const result = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter as any,
      mockTeamRepository as any,
      mockNotificationLogRepository as any
    );

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.remainingTimeMinutes).toBe(30);

    const notificationDetails = result.notificationDetails;
    expect(notificationDetails.length).toBe(2);

    const failedNotification = notificationDetails.find((nd: ReminderNotificationDetail) => nd.userId === '');
    expect(failedNotification).toBeDefined();
    expect(failedNotification?.status).toBe('failed');
    expect(failedNotification?.sentAt).toBeNull();
    expect(failedNotification?.errorMessage).toBe('INVALID_USER_ID');

    const successNotification = notificationDetails.find((nd: ReminderNotificationDetail) => nd.userId === 'user-002');
    expect(successNotification).toBeDefined();
    expect(successNotification?.status).toBe('sent');
    expect(successNotification?.sentAt).toEqual(new Date('2024-01-15T08:30:15Z'));
    expect(successNotification?.errorMessage).toBeNull();

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      1,
      '',
      expect.any(String),
      expect.arrayContaining(['email', 'in_app'])
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
      2,
      'user-002',
      expect.any(String),
      expect.arrayContaining(['email', 'in_app'])
    );

    expect(mockNotificationLogRepository.recordNotificationAttempt).toHaveBeenCalledTimes(2);
    expect(mockNotificationLogRepository.recordNotificationAttempt).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: '',
        status: 'failed',
        sentAt: null,
        errorMessage: 'INVALID_USER_ID',
      })
    );
    expect(mockNotificationLogRepository.recordNotificationAttempt).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 'user-002',
        status: 'sent',
        sentAt: expect.any(Date),
        errorMessage: null,
      })
    );
  });
});