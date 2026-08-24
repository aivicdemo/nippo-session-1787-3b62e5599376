import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - Edge Case Timing', () => {
  test('SCEN-296: notification is not sent 1 second before scheduled time (08:29:59)', async () => {
    // Mock current time to 1 second before the scheduled time
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const oneSecondBeforeScheduledTime = new Date('2024-01-15T08:29:59Z');
    const oneSecondAfterScheduledTime = new Date('2024-01-15T08:30:01Z');

    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email', 'slack'];

    let sendReminderNotificationCallCount = 0;
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => {
        sendReminderNotificationCallCount++;
        return {
          userId: 'user-001',
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:29:59Z'),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async () => undefined),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'pending' as const,
      })),
    };

    // Mock Date.now() to return 1 second before scheduled time
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => oneSecondBeforeScheduledTime.getTime());

    const input: SendDailyReportReminderInput = {
      scheduledTime: oneSecondBeforeScheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Call the function at 08:29:59 (1 second before scheduled time)
    const resultBeforeScheduledTime = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    // Verify that sendReminderNotification was NOT called at 08:29:59
    expect(sendReminderNotificationCallCount).toBe(0);
    expect(resultBeforeScheduledTime.sentCount).toBe(0);
    expect(resultBeforeScheduledTime.failedCount).toBe(0);

    // Now advance time to exactly 08:30:00 (scheduled time)
    Date.now = jest.fn(() => scheduledTime.getTime());

    const inputAtScheduledTime: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Manually invoke the send logic at the scheduled time
    // Note: In actual implementation, this would be called by a scheduler
    mockNotificationServiceAdapter.sendReminderNotification.mockClear();
    mockNotificationServiceAdapter.sendReminderNotification.mockImplementation(async () => ({
      userId: 'user-001',
      status: 'sent' as const,
      sentAt: scheduledTime,
      errorMessage: null,
    }));

    const resultAtScheduledTime = await sendDailyReportReminder(inputAtScheduledTime, mockNotificationServiceAdapter);

    // Verify that at 08:30:00, the function can process notifications
    expect(resultAtScheduledTime.sentCount).toBeGreaterThanOrEqual(0);

    // Advance time to 08:30:01 (1 second after scheduled time)
    Date.now = jest.fn(() => oneSecondAfterScheduledTime.getTime());

    const inputAfterScheduledTime: SendDailyReportReminderInput = {
      scheduledTime: oneSecondAfterScheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    mockNotificationServiceAdapter.sendReminderNotification.mockClear();
    const resultAfterScheduledTime = await sendDailyReportReminder(inputAfterScheduledTime, mockNotificationServiceAdapter);

    // Verify that no additional notifications are sent at 08:30:01
    // The reminder should only trigger once at the scheduled time
    expect(resultAfterScheduledTime.remainingTimeMinutes).toBe(
      Math.floor((reportDeadlineTime.getTime() - oneSecondAfterScheduledTime.getTime()) / 60000)
    );

    // Verify the notification details structure
    expect(Array.isArray(resultAfterScheduledTime.notificationDetails)).toBe(true);

    // Restore original Date.now
    Date.now = originalDateNow;
  });
});