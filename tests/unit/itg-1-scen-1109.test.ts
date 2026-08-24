import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification', () => {
  // SCEN-1109: [edge] 報告期限表示機能 - 報告期限までの残り時間がちょうど0分で表示される
  test('should display remaining time as exactly 0 minutes when system time equals deadline', async () => {
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T09:00:00Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' as const }),
    };

    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      notificationServiceAdapter as any,
    );

    expect(result.remainingTimeMinutes).toBe(0);
    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);

    const notificationDetail = result.notificationDetails[0];
    if (notificationDetail) {
      expect(notificationDetail.status).toMatch(/sent|skipped|failed/);
    }
  });
});