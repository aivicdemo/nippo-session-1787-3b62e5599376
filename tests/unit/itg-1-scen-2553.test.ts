import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-2553: [error] リマインド通知自動送信機能 - ユーザーID が空文字列のとき通知送信に失敗する
  test('should fail to send notification and record failure with retry queue when userId is empty string', async () => {
    // Arrange
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Mock adapter to simulate send failure for empty userId
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: Array<'email' | 'in_app' | 'slack'>) => {
        if (userId === '') {
          return {
            userId: '',
            status: 'failed' as const,
            sentAt: null,
            errorMessage: 'Invalid userId: empty string',
          };
        }
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:30:15Z'),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async (userId: string, retryIntervals: number[]) => {
        return {
          userId,
          retryIntervals,
          scheduledAt: new Date('2024-01-15T08:30:15Z'),
        };
      }),
      getDeliveryStatus: jest.fn(async (userId: string) => {
        return {
          userId,
          status: userId === '' ? 'failed' : 'sent',
        };
      }),
    };

    const notificationFailureLog: Array<{ userId: string; failureReason: string; timestamp: Date; retrySchedule: number[] }> = [];

    // Mock retry queue registration
    const retryQueueLog: Array<{ userId: string; retryIntervals: number[]; registeredAt: Date }> = [];
    const registerRetryQueue = jest.fn(async (userId: string, retryIntervals: number[]) => {
      retryQueueLog.push({
        userId,
        retryIntervals,
        registeredAt: new Date('2024-01-15T08:30:15Z'),
      });
    });

    // Mock failure recorder
    const recordNotificationFailure = jest.fn(async (userId: string, errorMessage: string) => {
      notificationFailureLog.push({
        userId,
        failureReason: errorMessage,
        timestamp: new Date('2024-01-15T08:30:15Z'),
        retrySchedule: [5, 15, 60],
      });
    });

    // Act
    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter as any,
      recordNotificationFailure as any,
      registerRetryQueue as any
    );

    // Assert - Output structure
    expect(output).toHaveProperty('sentCount');
    expect(output).toHaveProperty('failedCount');
    expect(output).toHaveProperty('remainingTimeMinutes');
    expect(output).toHaveProperty('notificationDetails');

    // Assert - At least one notification attempted
    expect(output.notificationDetails).toBeDefined();
    expect(Array.isArray(output.notificationDetails)).toBe(true);

    // Assert - Mock adapter was called
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    // Assert - Failure recorded with empty userId
    expect(recordNotificationFailure).toHaveBeenCalledWith(
      '',
      expect.stringMatching(/[Uu]serId|[Ee]mpty|[Ii]nvalid/)
    );

    // Assert - Retry queue registered with correct intervals (5 min, 15 min, 60 min)
    expect(registerRetryQueue).toHaveBeenCalledWith(
      '',
      [5, 15, 60]
    );

    // Assert - Retry schedule logged
    expect(retryQueueLog.length).toBeGreaterThan(0);
    expect(retryQueueLog[0].retryIntervals).toEqual([5, 15, 60]);

    // Assert - Failure log contains empty userId with FAILED status
    expect(notificationFailureLog.length).toBeGreaterThan(0);
    const failureRecord = notificationFailureLog.find(log => log.userId === '');
    expect(failureRecord).toBeDefined();
    expect(failureRecord?.userId).toBe('');
    expect(failureRecord?.retrySchedule).toEqual([5, 15, 60]);

    // Assert - notification detail shows failed status
    const emptyUserIdDetail = output.notificationDetails.find(detail => detail.userId === '');
    expect(emptyUserIdDetail).toBeDefined();
    expect(emptyUserIdDetail?.status).toBe('failed');
    expect(emptyUserIdDetail?.sentAt).toBeNull();
    expect(emptyUserIdDetail?.errorMessage).toMatch(/[Uu]serId|[Ee]mpty|[Ii]nvalid/);
  });
});