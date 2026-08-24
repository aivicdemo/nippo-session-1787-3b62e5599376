import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - Slack API経由のリマインド通知送信', () => {
  // SCEN-1032
  test('should send reminder notification via Slack API and return success status with audit log', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels = ['slack' as const];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:15Z'),
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result).toBeDefined();
    expect(result.sentCount).toBeGreaterThan(0);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);

    if (result.notificationDetails.length > 0) {
      const firstDetail = result.notificationDetails[0];
      expect(firstDetail.status).toBe('sent');
      expect(firstDetail.sentAt).toBeDefined();
      expect(firstDetail.errorMessage).toBeUndefined();
    }

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});