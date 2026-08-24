import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  test('SCEN-873: [error] リマインド通知自動送信機能 - NotificationServiceAdapterが3回再試行後も失敗したときアラート対象になる', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'slack'] as const;

    const failureMessage = 'ネットワークタイムアウト';
    let sendReminderCallCount = 0;
    const deliveryLogs: Array<{
      userId: string;
      status: 'sent' | 'failed' | 'skipped';
      sentAt: Date | null;
      errorMessage: string | null;
      attemptNumber: number;
      attemptTimestamp: Date;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, _channel: string) => {
        sendReminderCallCount += 1;
        const attemptTimestamp = new Date(scheduledTime.getTime() + (sendReminderCallCount - 1) * 60000);
        
        if (sendReminderCallCount <= 3) {
          const errorRecord = {
            userId,
            status: 'failed' as const,
            sentAt: null,
            errorMessage: failureMessage,
            attemptNumber: sendReminderCallCount,
            attemptTimestamp,
          };
          deliveryLogs.push(errorRecord);
          throw new Error(failureMessage);
        }

        const successRecord = {
          userId,
          status: 'sent' as const,
          sentAt: attemptTimestamp,
          errorMessage: null,
          attemptNumber: sendReminderCallCount,
          attemptTimestamp,
        };
        deliveryLogs.push(successRecord);
        return { success: true, sentAt: attemptTimestamp };
      }),

      scheduleNotification: jest.fn(async () => ({ scheduled: true })),

      getDeliveryStatus: jest.fn(async () => ({
        total: 4,
        sent: 0,
        failed: 4,
        skipped: 0,
      })),
    };

    const mockAlertService = {
      sendAdminAlert: jest.fn(async (message: string) => ({
        alertId: 'alert-001',
        sentAt: new Date('2024-01-15T08:45:00Z'),
        message,
      })),
    };

    const input = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    let result: Awaited<ReturnType<typeof sendDailyReportReminder>>;
    let alertWasSent = false;
    let alertMessage = '';

    try {
      result = await sendDailyReportReminder(input, mockNotificationServiceAdapter as any);
      
      if (mockAlertService.sendAdminAlert.mock.calls.length > 0) {
        alertWasSent = true;
        alertMessage = mockAlertService.sendAdminAlert.mock.calls[0][0];
      }
    } catch (error) {
      if (mockAlertService.sendAdminAlert.mock.calls.length > 0) {
        alertWasSent = true;
        alertMessage = mockAlertService.sendAdminAlert.mock.calls[0][0];
      }
    }

    const failedLogs = deliveryLogs.filter(log => log.status === 'failed');
    expect(failedLogs).toHaveLength(4);

    expect(failedLogs[0].attemptNumber).toBe(1);
    expect(failedLogs[0].errorMessage).toBe(failureMessage);

    expect(failedLogs[1].attemptNumber).toBe(2);
    expect(failedLogs[1].errorMessage).toBe(failureMessage);

    expect(failedLogs[2].attemptNumber).toBe(3);
    expect(failedLogs[2].errorMessage).toBe(failureMessage);

    expect(result!.failedCount).toBeGreaterThanOrEqual(1);
    expect(result!.notificationDetails).toBeDefined();
    expect(Array.isArray(result!.notificationDetails)).toBe(true);

    const failedDetails = result!.notificationDetails.filter(d => d.status === 'failed');
    expect(failedDetails.length).toBeGreaterThanOrEqual(1);
    expect(failedDetails[0].errorMessage).toMatch(/タイムアウト|失敗/);
  });
});