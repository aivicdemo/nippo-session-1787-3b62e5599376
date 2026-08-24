import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-372
  test('should throw error and log failure when team member list is null', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockImplementation(() => {
        const nullMemberList = null;
        if (nullMemberList === null) {
          throw new Error('チームメンバーリストが無効です');
        }
        return {
          sentCount: 10,
          failedCount: 0,
          remainingTimeMinutes: 30,
          notificationDetails: [],
        };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockDashboardNotifier = {
      notify: jest.fn(),
    };

    const mockDeliveryLogger = {
      recordFailure: jest.fn(),
    };

    expect(() =>
      sendDailyReportReminder(
        input,
        mockNotificationServiceAdapter,
        mockDashboardNotifier,
        mockDeliveryLogger
      )
    ).toThrow(/チームメンバーリスト/);

    expect(mockDashboardNotifier.notify).toHaveBeenCalledWith({
      message: 'リマインド送信に失敗しました',
      severity: 'error',
    });

    expect(mockDeliveryLogger.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        error_reason: 'null_member_list',
      })
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});