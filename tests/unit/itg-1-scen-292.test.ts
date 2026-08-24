import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  NotificationServiceAdapter,
} from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - NotificationServiceAdapter timeout handling', () => {
  // SCEN-292
  test('should handle NotificationServiceAdapter sendReminderNotification timeout error and record failure in notification log', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const notificationLog: Array<{
      user_id: string;
      timestamp: Date;
      status: string;
      retry_count: number;
      error_message?: string;
    }> = [];

    const timeoutError = new Error('Notification delivery timeout');
    timeoutError.name = 'TimeoutError';

    const errorHandler = jest.fn((error: Error) => {
      notificationLog.push({
        user_id: 'user-001',
        timestamp: new Date('2024-01-15T08:31:00Z'),
        status: 'timeout',
        retry_count: 0,
        error_message: error.message,
      });
    });

    const mockNotificationServiceAdapter: Partial<NotificationServiceAdapter> = {
      sendReminderNotification: jest.fn(async () => {
        throw timeoutError;
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    try {
      await sendDailyReportReminder(input, mockNotificationServiceAdapter as NotificationServiceAdapter, errorHandler);
    } catch (error) {
      expect(error).toBe(timeoutError);
    }

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler).toHaveBeenCalledWith(timeoutError);

    expect(notificationLog).toHaveLength(1);
    expect(notificationLog[0]).toEqual({
      user_id: 'user-001',
      timestamp: new Date('2024-01-15T08:31:00Z'),
      status: 'timeout',
      retry_count: 0,
      error_message: 'Notification delivery timeout',
    });

    expect(notificationLog[0].status).toBe('timeout');
    expect(notificationLog[0].retry_count).toBe(0);
  });
});