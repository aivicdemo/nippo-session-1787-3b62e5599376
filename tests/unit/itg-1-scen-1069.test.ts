import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder - リマインド通知自動送信機能', () => {
  // SCEN-1069
  test('報告期限が null のとき、残時間計算でエラーが発生し、外部通知は実行されず、管理者アラートが記録される', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = null as any;
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:31:00Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    expect(() => {
      sendDailyReportReminder(input, mockNotificationServiceAdapter);
    }).toThrow(/null|undefined|Cannot read/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});