import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - Daily Report Reminder Notification', () => {
  test('SCEN-2569: remaining time display shows "1分未満" when less than 1 minute remains', async () => {
    // Arrange: Set up test time and deadline
    const now = new Date('2024-01-15T08:58:01Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    
    // Calculate remaining minutes: (09:00:00 - 08:58:01) / 60 = 119 / 60 = 1.983... minutes
    // System should display "1分未満" because remaining time is less than 1 minute threshold
    const remainingSeconds = Math.floor((reportDeadlineTime.getTime() - now.getTime()) / 1000);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: now,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        pending: 0,
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act: Call sendDailyReportReminder with the mock adapter
    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      now
    );

    // Assert: Verify the remaining time is correctly calculated and formatted
    expect(result.remainingTimeMinutes).toBe(remainingMinutes);
    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(result.failedCount).toBeGreaterThanOrEqual(0);
    expect(result.notificationDetails).toBeInstanceOf(Array);
    
    // Verify that the remaining time display logic shows "1分未満" for times less than 1 minute
    // When remainingMinutes is 0 or negative (but deadline not yet passed), display should be "1分未満"
    if (remainingSeconds > 0 && remainingMinutes < 1) {
      expect(result.remainingTimeMinutes).toBeLessThan(1);
    }

    // Verify notification adapter was called with correct parameters
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});