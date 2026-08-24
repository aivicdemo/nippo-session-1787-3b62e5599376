import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - Daily Report Reminder Notification', () => {
  // SCEN-379
  test('should abort processing and not call NotificationServiceAdapter when teamIds array is empty', async () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: [],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    try {
      await sendDailyReportReminder(input, mockNotificationAdapter, mockLogger);
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toMatch(/チームID|team.*required|empty/i);
    }

    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/チームID|team.*required/i)
    );
  });
});