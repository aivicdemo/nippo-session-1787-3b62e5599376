import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('リマインド通知自動送信機能', () => {
  test('SCEN-876: 期限までの残り時間がnullで返されたときエラーになる', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app'],
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:15Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 0,
        failed: 0,
        pending: 0,
      }),
      getTimeUntilDeadline: jest.fn().mockReturnValue(null),
    };

    const mockAdminAlertRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'alert-001',
        alertType: '残り時間計算エラー',
        description: '残り時間計算エラー・テストID:SCEN-876',
        createdAt: new Date('2024-01-15T08:30:00Z'),
      }),
    };

    const logSpy = jest.spyOn(console, 'error').mockImplementation();

    try {
      await sendDailyReportReminder(
        input,
        mockNotificationServiceAdapter,
        mockAdminAlertRepository
      );
      fail('エラーがスローされるべき');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toMatch(/残り時間/);
      }
    }

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('残り時間の計算に失敗しました')
    );
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockAdminAlertRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: '残り時間計算エラー',
        description: expect.stringContaining('残り時間計算エラー・テストID:SCEN-876'),
      })
    );
    expect(mockAdminAlertRepository.create).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
  });
});