import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  test('SCEN-375: メールアドレス欠落時は処理が中断される', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const teamIds = ['TEAM-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockImplementation(async (userId: string) => {
        if (userId === 'USR-005') {
          throw new Error('Notification recipient email is missing for user: USR-005');
        }
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T09:00:00Z'),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockLoggerAdapter = {
      logNotificationDistribution: jest.fn(),
      logError: jest.fn(),
    };

    const mockMemberRepository = {
      findTeamMembersWithEmails: jest.fn().mockResolvedValue([
        { userId: 'USR-001', email: 'user001@example.com' },
        { userId: 'USR-002', email: 'user002@example.com' },
        { userId: 'USR-003', email: 'user003@example.com' },
        { userId: 'USR-004', email: 'user004@example.com' },
        { userId: 'USR-005', email: null },
        { userId: 'USR-006', email: 'user006@example.com' },
        { userId: 'USR-007', email: 'user007@example.com' },
        { userId: 'USR-008', email: 'user008@example.com' },
        { userId: 'USR-009', email: 'user009@example.com' },
        { userId: 'USR-010', email: 'user010@example.com' },
      ]),
    };

    const input = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    let thrownError: Error | null = null;
    let result: any = null;

    try {
      result = await sendDailyReportReminder(
        input,
        mockNotificationAdapter,
        mockLoggerAdapter,
        mockMemberRepository
      );
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/通知先|email|missing/i);

    expect(mockLoggerAdapter.logError).toHaveBeenCalled();
    const errorLogCall = mockLoggerAdapter.logError.mock.calls[0];
    expect(errorLogCall[0]).toMatch(/USR-005/);

    expect(mockLoggerAdapter.logNotificationDistribution).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'USR-005',
        status: expect.stringMatching(/error|failed|前エラー/i),
        errorMessage: expect.stringMatching(/email|未設定|missing/i),
      })
    );

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(0);

    if (result) {
      expect(result.sentCount).toBe(0);
      expect(result.failedCount).toBeGreaterThan(0);
    }
  });
});