import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  NotificationServiceAdapter,
} from '../../src/logic/submission-status-tracking';

describe('Send Daily Report Reminder - Schedule Registration', () => {
  // SCEN-158
  test('should schedule reminder notification for next day at 09:00 when current time is 08:59', async () => {
    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ sentAt: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduledId: 'sched-001' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const currentDateTime = new Date('2024-01-15T08:59:00+09:00');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00+09:00');
    const scheduledTime = new Date('2024-01-15T08:59:00+09:00');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mockNotificationAdapter);

    expect(result).toBeDefined();
    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(result.failedCount).toBeGreaterThanOrEqual(0);
    expect(result.remainingTimeMinutes).toBe(1);

    expect(mockNotificationAdapter.scheduleNotification).toHaveBeenCalled();

    const scheduleCall = (mockNotificationAdapter.scheduleNotification as jest.Mock).mock.calls[0];
    expect(scheduleCall).toBeDefined();

    const scheduledDateTime = scheduleCall[0];
    const expectedScheduledDateTime = new Date('2024-01-16T09:00:00+09:00');

    expect(scheduledDateTime.getUTCHours()).toBe(expectedScheduledDateTime.getUTCHours());
    expect(scheduledDateTime.getUTCMinutes()).toBe(0);
    expect(scheduledDateTime.getDate()).toBe(16);

    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);
  });
});