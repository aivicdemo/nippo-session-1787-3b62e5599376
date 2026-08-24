import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知自動送信機能', () => {
  // SCEN-282
  test('定時タイムスタンプが null のとき処理が中断される', () => {
    const mockScheduleNotification = jest.fn();
    const mockNotificationServiceAdapter = {
      scheduleNotification: mockScheduleNotification,
      sendReminderNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: null as any,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'slack'],
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(mockScheduleNotification).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/定時タイムスタンプが null/)
    );
    expect(result).toEqual({
      sentCount: 0,
      failedCount: 0,
      remainingTimeMinutes: 0,
      notificationDetails: [],
    });

    consoleErrorSpy.mockRestore();
  });
});