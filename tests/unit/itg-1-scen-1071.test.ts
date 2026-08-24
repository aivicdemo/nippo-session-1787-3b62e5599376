import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

const fetchMock = require('jest-fetch-mock');

describe('SendDailyReportReminder - Notification Error Handling', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1071
  test('should handle notification failure when report deadline is in the past and adapter returns error', async () => {
    const pastDeadlineTime = new Date('2025-01-01T09:00:00Z');
    const scheduledTime = new Date('2025-01-02T08:30:00Z');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime: pastDeadlineTime,
      notificationChannels: ['email', 'in_app'],
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValueOnce(
        new Error('Deadline validation failed')
      ),
      scheduleNotification: jest.fn().mockResolvedValueOnce({ success: true }),
      getDeliveryStatus: jest.fn().mockResolvedValueOnce({ status: 'failed' }),
    };

    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result).toBeDefined();
    expect(result.failedCount).toBeGreaterThan(0);
    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    
    const callArgs = mockNotificationServiceAdapter.sendReminderNotification.mock.calls[0];
    expect(callArgs).toBeDefined();
  });
});