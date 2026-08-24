import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-872
  test('NotificationServiceAdapterのscheduleNotificationが失敗したときはエラーハンドリングが順序通り実行される', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        userId: 'user-001',
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockRejectedValueOnce(
        new Error('Schedule API timeout')
      ),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'failed' as const,
      }),
    };

    const mockNotificationLoggingService = {
      recordFailure: jest.fn().mockResolvedValue(undefined),
      recordRetrySchedule: jest.fn().mockResolvedValue(undefined),
      recordAdminAlert: jest.fn().mockResolvedValue(undefined),
    };

    const mockInternalQueue = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };

    const mockDashboardService = {
      setDelayWarningMessage: jest.fn().mockResolvedValue(undefined),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockNotificationLoggingService,
      mockInternalQueue,
      mockDashboardService
    );

    expect(mockNotificationServiceAdapter.scheduleNotification).toHaveBeenCalled();
    
    expect(mockNotificationLoggingService.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        failureReason: expect.stringMatching(/timeout|failed/i),
        timestamp: expect.any(Date),
      })
    );

    expect(mockInternalQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'reminder_notification',
        teamIds: ['team-001', 'team-002'],
        retryCount: 0,
      })
    );

    const retrySchedules = mockNotificationLoggingService.recordRetrySchedule.mock.calls;
    expect(retrySchedules.length).toBe(3);
    
    expect(retrySchedules[0][0]).toMatchObject({
      retryAttempt: 1,
      delayMinutes: 5,
    });
    expect(retrySchedules[1][0]).toMatchObject({
      retryAttempt: 2,
      delayMinutes: 15,
    });
    expect(retrySchedules[2][0]).toMatchObject({
      retryAttempt: 3,
      delayMinutes: 60,
    });

    expect(mockNotificationLoggingService.recordAdminAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: 'schedule_failure',
        message: expect.stringMatching(/failed after 3 retries/i),
      })
    );

    expect(mockDashboardService.setDelayWarningMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '通知送信に遅延が発生しています',
        severity: 'warning',
      })
    );

    expect(result).toMatchObject({
      sentCount: expect.any(Number),
      failedCount: expect.any(Number),
      remainingTimeMinutes: 30,
      notificationDetails: expect.arrayContaining([
        expect.objectContaining({
          status: expect.stringMatching(/failed|skipped/),
        }),
      ]),
    });
  });
});