import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-2557
  test('[error] リマインド通知自動送信機能 - 報告期限が過去日時のとき残り時間計算に失敗する', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T07:30:00Z');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app'],
    };

    let thrownError: Error | null = null;
    try {
      sendDailyReportReminder(input, mockNotificationServiceAdapter, mockLogger);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/報告期限が過去日時|残り時間計算に失敗/);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/報告期限が過去日時のため残り時間計算に失敗/)
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});