import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - NotificationServiceAdapter連携', () => {
  // SCEN-1037
  test('NotificationServiceAdapterのsendReminderNotificationが正常応答した場合、配信ステータスが業務ロジックに返される', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:00:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    const callArgs = mockNotificationServiceAdapter.sendReminderNotification.mock.calls[0];
    expect(callArgs[0]).toBeDefined();

    expect(result.sentCount).toBeGreaterThan(0);
    expect(result.failedCount).toBe(0);

    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);

    const deliveredNotifications = result.notificationDetails.filter(
      (detail: ReminderNotificationDetail) => detail.status === 'sent'
    );
    expect(deliveredNotifications.length).toBeGreaterThan(0);

    const sentNotification = result.notificationDetails.find(
      (detail: ReminderNotificationDetail) => detail.status === 'sent'
    );
    if (sentNotification) {
      expect(sentNotification.sentAt).not.toBeNull();
      expect(typeof sentNotification.sentAt).toBe('object');
    }

    expect(result.remainingTimeMinutes).toBeGreaterThanOrEqual(0);
  });
});