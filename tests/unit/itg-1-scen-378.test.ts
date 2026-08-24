import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-378
  test('スケジュール発火時刻が指定されていない（null）のとき、処理が中断される', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      scheduledTime: null as unknown as Date,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'] as const,
    };

    const result = sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_SCHEDULE_TIME');
    expect(result.message).toMatch(/スケジュール発火時刻/);
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});