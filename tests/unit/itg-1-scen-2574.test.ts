import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - Reverse Order Delivery', () => {
  // SCEN-2574
  test('should deliver reminder notifications to all team members even when sent in reverse user order', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'slack'] as const;

    const mockNotificationCalls: Array<{
      userId: string;
      status: 'sent' | 'failed' | 'skipped';
      sentAt: Date | null;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        const sentTime = new Date('2024-01-15T08:30:15Z');
        mockNotificationCalls.push({
          userId,
          status: 'sent',
          sentAt: sentTime,
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt: sentTime,
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async () => {
        return { scheduled: true };
      }),
      getDeliveryStatus: jest.fn(async () => {
        return { delivered: 10, failed: 0, pending: 0 };
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(output.sentCount).toBe(10);
    expect(output.failedCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(30);
    expect(output.notificationDetails).toHaveLength(10);

    const notificationDetails = output.notificationDetails;
    for (let i = 0; i < notificationDetails.length; i++) {
      expect(notificationDetails[i].status).toBe('sent');
      expect(notificationDetails[i].sentAt).not.toBeNull();
      expect(notificationDetails[i].errorMessage).toBeNull();
    }

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    const callUserIds = mockNotificationCalls.map((call) => call.userId);
    const reverseOrderExpected = ['user10', 'user9', 'user8', 'user7', 'user6', 'user5', 'user4', 'user3', 'user2', 'user1'];

    expect(callUserIds).toEqual(reverseOrderExpected);

    const allCallsSuccessful = mockNotificationCalls.every((call) => call.status === 'sent');
    expect(allCallsSuccessful).toBe(true);

    expect(mockNotificationCalls).toHaveLength(10);
  });
});