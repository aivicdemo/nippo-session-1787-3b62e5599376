import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-377: [error] 定時リマインド送信機能 - 報告期限までの残り時間が負の値のとき、処理が中断される
  test('報告期限超過時はリマインド送信をスキップし例外をスロー', async () => {
    const now = new Date('2024-01-15T09:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: now,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email'],
    };

    const expectedRemainingTimeMinutes = -30;

    expect(() =>
      sendDailyReportReminder(input, mockNotificationServiceAdapter)
    ).toThrow(/期限超過/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});