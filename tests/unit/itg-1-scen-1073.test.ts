import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification Feature', () => {
  // SCEN-1073
  test('should send admin alert after 3 retry failures with correct log records', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email'];

    const failureTimestamps: Date[] = [];
    const alertsSent: Array<{ userId: string; message: string; timestamp: Date }> = [];
    let attemptCount = 0;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => {
        attemptCount++;
        const timestamp = new Date();
        failureTimestamps.push(timestamp);
        throw new Error('SERVICE_UNAVAILABLE');
      }),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'pending' })),
    };

    const mockAdminAlertService = {
      sendAlert: jest.fn(async (message: string) => {
        alertsSent.push({
          userId: 'user-001',
          message,
          timestamp: new Date(),
        });
        return { success: true };
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockAdminAlertService,
    );

    expect(attemptCount).toBe(3);
    expect(output.failedCount).toBeGreaterThanOrEqual(1);
    expect(alertsSent).toHaveLength(1);

    const alertMessage = alertsSent[0].message;
    expect(alertMessage).toMatch(/通知送信3回失敗/);
    expect(alertMessage).toMatch(/ユーザーID=user-001/);
    expect(alertMessage).toMatch(/SERVICE_UNAVAILABLE/);

    expect(mockAdminAlertService.sendAlert).toHaveBeenCalledWith(
      expect.stringContaining('3回失敗'),
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);
  });
});