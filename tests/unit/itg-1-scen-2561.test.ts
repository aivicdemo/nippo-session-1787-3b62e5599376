import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - NotificationServiceAdapter timeout retry', () => {
  let mockNotificationAdapter: any;
  let callCount: number;
  let callTimestamps: number[];

  beforeEach(() => {
    callCount = 0;
    callTimestamps = [];

    mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        callCount++;
        callTimestamps.push(Date.now());

        if (callCount <= 3) {
          throw new Error('Timeout: SendReminderNotification API timeout');
        }

        return {
          userId,
          status: 'sent',
          sentAt: new Date(),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ delivered: 0, failed: 0, pending: 0 })),
    };

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // SCEN-2561
  test('should retry 3 times with exponential backoff intervals (5m, 15m, 1h) when NotificationServiceAdapter times out', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels = ['email', 'slack'] as const;

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const reminderPromise = sendDailyReportReminder(input, mockNotificationAdapter);

    // 1st attempt (immediate)
    await jest.runOnlyPendingTimersAsync();
    expect(callCount).toBe(1);
    const firstTimestamp = callTimestamps[0];

    // 2nd attempt (after 5 minutes)
    jest.advanceTimersByTime(5 * 60 * 1000);
    await jest.runOnlyPendingTimersAsync();
    expect(callCount).toBe(2);
    const secondTimestamp = callTimestamps[1];
    expect(secondTimestamp - firstTimestamp).toBeGreaterThanOrEqual(5 * 60 * 1000 - 100);
    expect(secondTimestamp - firstTimestamp).toBeLessThanOrEqual(5 * 60 * 1000 + 100);

    // 3rd attempt (after 15 minutes from 2nd)
    jest.advanceTimersByTime(15 * 60 * 1000);
    await jest.runOnlyPendingTimersAsync();
    expect(callCount).toBe(3);
    const thirdTimestamp = callTimestamps[2];
    expect(thirdTimestamp - secondTimestamp).toBeGreaterThanOrEqual(15 * 60 * 1000 - 100);
    expect(thirdTimestamp - secondTimestamp).toBeLessThanOrEqual(15 * 60 * 1000 + 100);

    // 4th attempt (after 1 hour from 3rd)
    jest.advanceTimersByTime(60 * 60 * 1000);
    await jest.runOnlyPendingTimersAsync();
    expect(callCount).toBe(4);
    const fourthTimestamp = callTimestamps[3];
    expect(fourthTimestamp - thirdTimestamp).toBeGreaterThanOrEqual(60 * 60 * 1000 - 100);
    expect(fourthTimestamp - thirdTimestamp).toBeLessThanOrEqual(60 * 60 * 1000 + 100);

    // Verify no 5th attempt
    jest.advanceTimersByTime(2 * 60 * 60 * 1000);
    await jest.runOnlyPendingTimersAsync();
    expect(callCount).toBe(4);

    // Wait for the promise to settle
    jest.useRealTimers();
    const result: SendDailyReportReminderOutput = await reminderPromise;

    // Verify output structure
    expect(result).toBeDefined();
    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBeGreaterThan(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(Array.isArray(result.notificationDetails)).toBe(true);

    // Verify notification details include 4 failed attempts
    const failedDetails = result.notificationDetails.filter(
      (detail: ReminderNotificationDetail) => detail.status === 'failed'
    );
    expect(failedDetails.length).toBeGreaterThanOrEqual(4);

    // Verify all failed attempts have timestamps and error messages
    failedDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('failed');
      expect(detail.errorMessage).toBeDefined();
      expect(detail.errorMessage).toMatch(/Timeout|timeout/);
    });

    // Verify total call count matches expected attempts (initial + 3 retries)
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(4);
  });
});