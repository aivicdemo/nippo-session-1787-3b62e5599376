import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - Submission Status Tracking', () => {
  test('SCEN-874: Error when report deadline is in the past', async () => {
    // Arrange
    const now = new Date('2026-08-19T10:00:00Z');
    const pastDeadline = new Date('2026-08-19T09:00:00Z');

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent', sentAt: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: now,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: pastDeadline,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act & Assert
    await expect(() =>
      sendDailyReportReminder(input, mockNotificationServiceAdapter)
    ).rejects.toThrow(/報告期限は現在時刻より後の時刻を指定してください/);

    // Verify that scheduleNotification was not called
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});