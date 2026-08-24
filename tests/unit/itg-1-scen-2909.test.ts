import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  test('SCEN-2909: 朝会開始予定時刻の30分前までまだ到達していない場合リマインド通知は送信されない', () => {
    // Arrange
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' as const }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: 0, failed: 0, pending: 0 }),
    };

    const baseTime = new Date('2025-01-15T08:00:00Z');
    const scheduledTime = new Date('2025-01-15T08:00:00Z');
    const reportDeadlineTime = new Date(baseTime.getTime() + 25 * 60 * 1000); // 25分後（30分前より手前）

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act
    const result = sendDailyReportReminder(input, mockNotificationServiceAdapter);

    // Assert
    expect(result).toEqual<SendDailyReportReminderOutput>({
      sentCount: 0,
      failedCount: 0,
      remainingTimeMinutes: 25,
      notificationDetails: [],
    });
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});