import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - scheduled notification at specified time', () => {
  // SCEN-1108
  test('should send reminder notification exactly 1 second after the scheduled time with timezone-aware scheduling', async () => {
    jest.useFakeTimers();
    
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    let scheduleNotificationCalled = false;
    let scheduleNotificationCallTime: Date | null = null;
    let sendReminderNotificationCalls: Array<{ time: Date; userId: string; channel: string }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, _message: string, _channel: string) => {
        const callTime = new Date();
        sendReminderNotificationCalls.push({ time: callTime, userId, channel: _channel });
        return {
          userId,
          status: 'sent' as const,
          sentAt: callTime,
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async (_teamIds: string[], _scheduledTime: Date) => {
        scheduleNotificationCalled = true;
        scheduleNotificationCallTime = new Date(_scheduledTime);
      }),
      getDeliveryStatus: jest.fn(async () => ({ status: 'sent' })),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Set system time to 1 second before scheduled time (08:59:59)
    const timeBeforeSchedule = new Date('2024-01-15T08:59:59Z');
    jest.setSystemTime(timeBeforeSchedule);

    // Call the function to set up scheduling
    const resultBeforeSchedule = await sendDailyReportReminder(input, mockNotificationServiceAdapter as any);
    expect(resultBeforeSchedule).toBeDefined();
    expect(resultBeforeSchedule.remainingTimeMinutes).toBe(1);

    // Advance time to scheduled time + 1 second (09:00:01)
    const timeAfterSchedule = new Date('2024-01-15T09:00:01Z');
    jest.setSystemTime(timeAfterSchedule);

    // Call the function again at the scheduled time + 1 second
    const resultAtScheduledTime = await sendDailyReportReminder(input, mockNotificationServiceAdapter as any);

    // Verify the output structure
    expect(resultAtScheduledTime).toHaveProperty('sentCount');
    expect(resultAtScheduledTime).toHaveProperty('failedCount');
    expect(resultAtScheduledTime).toHaveProperty('remainingTimeMinutes');
    expect(resultAtScheduledTime).toHaveProperty('notificationDetails');

    // Verify sendReminderNotification was called
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    // Verify timing: notification should be sent at 09:00:01 (±100ms tolerance)
    const notificationCallTimes = sendReminderNotificationCalls.map(call => call.time.getTime());
    const expectedTime = new Date('2024-01-15T09:00:01Z').getTime();
    const timeDifferences = notificationCallTimes.map(time => Math.abs(time - expectedTime));
    
    timeDifferences.forEach(diff => {
      expect(diff).toBeLessThanOrEqual(100);
    });

    // Verify notification details in output
    const typedOutput = resultAtScheduledTime as SendDailyReportReminderOutput;
    const sentNotifications = typedOutput.notificationDetails.filter(
      (detail: ReminderNotificationDetail) => detail.status === 'sent'
    );
    expect(sentNotifications.length).toBeGreaterThan(0);

    // Verify sent count
    expect(typedOutput.sentCount).toBeGreaterThan(0);
    expect(typedOutput.failedCount).toBe(0);

    // Verify no notifications were sent before the scheduled time
    jest.setSystemTime(new Date('2024-01-15T08:59:58Z'));
    sendReminderNotificationCalls = [];
    
    await sendDailyReportReminder(input, mockNotificationServiceAdapter as any);
    expect(sendReminderNotificationCalls.length).toBe(0);

    // Verify no additional notifications after scheduled time + 1 second
    jest.setSystemTime(new Date('2024-01-15T09:00:05Z'));
    const callCountBefore = mockNotificationServiceAdapter.sendReminderNotification.mock.calls.length;
    
    await sendDailyReportReminder(input, mockNotificationServiceAdapter as any);
    
    const callCountAfter = mockNotificationServiceAdapter.sendReminderNotification.mock.calls.length;
    expect(callCountAfter - callCountBefore).toBeLessThanOrEqual(1);

    // Verify remaining time is calculated correctly
    expect(typedOutput.remainingTimeMinutes).toBeLessThanOrEqual(1);
    expect(typedOutput.remainingTimeMinutes).toBeGreaterThanOrEqual(-1);

    jest.useRealTimers();
  });
});