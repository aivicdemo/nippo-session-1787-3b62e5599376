import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  test('SCEN-1033: Microsoft Teams API経由でリマインド通知が正常送信された場合、配信ステータスが成功として返される', () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels = ['in_app', 'slack'] as const;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:15Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({}),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter
    );

    expect(result.sentCount).toBeGreaterThan(0);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);

    result.notificationDetails.forEach((detail) => {
      expect(detail.userId).toBeDefined();
      expect(['sent', 'failed', 'skipped']).toContain(detail.status);
      if (detail.status === 'sent') {
        expect(detail.sentAt).toBeDefined();
        expect(detail.sentAt).toBeInstanceOf(Date);
        expect(detail.errorMessage).toBeNull();
      }
    });
  });
});