import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-2894
  test('朝会開始予定時刻が未設定のときリマインド通知が送信されない', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'pending' as const,
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: undefined,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const output = sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(output.sentCount).toBe(0);
    expect(output.failedCount).toBe(0);
    expect(output.notificationDetails).toEqual([]);
  });
});