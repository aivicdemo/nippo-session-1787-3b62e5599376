import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-285
  test('should handle invalid report deadline timestamp format and stop processing without retry', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2026-08-19T08:30:00Z'),
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const invalidInput: SendDailyReportReminderInput = {
      scheduledTime: new Date('2026-08-19T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('invalid-date'),
      notificationChannels: ['email'],
    };

    let thrownError: Error | null = null;

    try {
      await sendDailyReportReminder(invalidInput, mockNotificationServiceAdapter);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/タイムスタンプ形式エラー/);
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});