import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily report reminder notification - past deadline handling', () => {
  test('SCEN-2900: should not send reminders when report deadline time is in the past', async () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const pastDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const scheduledTime = new Date('2024-01-15T10:00:00Z');

    const mockSendReminderNotification = jest.fn().mockResolvedValue({
      userId: 'user-001',
      status: 'sent' as const,
      sentAt: now,
      errorMessage: null,
    });

    const mockGetDeliveryStatus = jest.fn().mockResolvedValue({
      sent: 0,
      failed: 0,
      pending: 0,
    });

    const notificationServiceAdapter = {
      sendReminderNotification: mockSendReminderNotification,
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: mockGetDeliveryStatus,
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: pastDeadlineTime,
      notificationChannels: ['email', 'in_app'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, notificationServiceAdapter);

    expect(mockSendReminderNotification).not.toHaveBeenCalled();
    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBeLessThan(0);
    expect(result.notificationDetails).toEqual([]);
  });
});