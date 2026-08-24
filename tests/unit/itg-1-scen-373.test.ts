import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type NotificationServiceAdapter } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder - Empty Team Members List', () => {
  // SCEN-373
  test('should not call notification service and log error when team members list is empty', async () => {
    const mockNotificationServiceAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ sentAt: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const systemLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    let caughtError: Error | undefined;
    let output: SendDailyReportReminderOutput | undefined;

    try {
      output = await sendDailyReportReminder(input, mockNotificationServiceAdapter, [], systemLogger);
    } catch (err) {
      caughtError = err instanceof Error ? err : new Error(String(err));
    }

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(systemLogger.error).toHaveBeenCalledWith(expect.stringMatching(/リマインド送信対象者が存在しません/));
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/リマインド送信対象者/);
  });
});