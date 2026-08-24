import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-2547
  test('should send reminder notifications to all 10 team members at scheduled time', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['slack', 'email'];

    const notificationDetails: ReminderNotificationDetail[] = [];
    const sendReminderCalls: Array<{ userId: string; channelType: string }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        sendReminderCalls.push({ userId, channelType: channels[0] });
        notificationDetails.push({
          userId,
          status: 'sent',
          sentAt: new Date('2024-01-15T09:00:05Z'),
          errorMessage: null,
        });
        return { success: true, deliveryStatus: 'sent' };
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ delivered: 10 })),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(10);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    result.notificationDetails.forEach((detail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toEqual(new Date('2024-01-15T09:00:05Z'));
      expect(detail.errorMessage).toBeNull();
    });

    expect(sendReminderCalls).toHaveLength(10);
    sendReminderCalls.forEach((call) => {
      expect(call.userId).toMatch(/^user-\d{3}$/);
      expect(['slack', 'email']).toContain(call.channelType);
    });

    const sentAtTimes = result.notificationDetails
      .map((detail) => detail.sentAt?.getTime() ?? 0)
      .filter((time) => time > 0);
    const minTime = Math.min(...sentAtTimes);
    const maxTime = Math.max(...sentAtTimes);
    expect(maxTime - minTime).toBeLessThanOrEqual(1000);
  });
});