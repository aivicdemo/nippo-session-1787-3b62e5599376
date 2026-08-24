import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  test('SCEN-2884: should record notification as success when external service responds normally', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        userId: 'user-001',
        sentAt: new Date('2024-01-15T09:30:00Z'),
        responseCode: 200,
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const sendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-dev-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['slack' as const, 'email' as const],
    };

    const result = await sendDailyReportReminder(
      sendDailyReportReminderInput,
      mockNotificationServiceAdapter
    );

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(1);

    const notificationDetail = result.notificationDetails[0];
    expect(notificationDetail.userId).toBe('user-001');
    expect(notificationDetail.status).toBe('sent');
    expect(notificationDetail.sentAt).toEqual(new Date('2024-01-15T09:30:00Z'));
    expect(notificationDetail.errorMessage).toBeNull();

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        channels: ['slack', 'email'],
        remainingMinutes: 30,
      })
    );
  });
});