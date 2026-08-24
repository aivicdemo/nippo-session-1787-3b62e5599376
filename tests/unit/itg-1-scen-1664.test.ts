import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-1664
  test('毎週月曜朝の定時スケジュール登録が正確に設定される', async () => {
    const scheduledTime = new Date('2024-01-08T09:00:00+09:00');
    const reportDeadlineTime = new Date('2024-01-08T09:00:00+09:00');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const mockScheduledNotifications: Array<{
      cronExpression: string;
      userCount: number;
      notificationType: string;
      status: number;
      scheduleId: string;
      registeredAt: string;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: async (
        userId: string,
        message: string,
        channels: Array<'email' | 'in_app' | 'slack'>
      ): Promise<{ status: 'sent' | 'failed'; sentAt?: Date; errorMessage?: string }> => {
        return { status: 'sent', sentAt: new Date('2024-01-08T09:00:00Z') };
      },
      scheduleNotification: async (config: {
        cronExpression: string;
        userCount: number;
        notificationType: string;
      }): Promise<{ statusCode: number; scheduleId: string; registeredAt: string }> => {
        const registrationRecord = {
          cronExpression: config.cronExpression,
          userCount: config.userCount,
          notificationType: config.notificationType,
          status: 200,
          scheduleId: 'sched-' + Date.now(),
          registeredAt: new Date('2024-01-08T09:00:00Z').toISOString(),
        };
        mockScheduledNotifications.push(registrationRecord);
        return {
          statusCode: 200,
          scheduleId: registrationRecord.scheduleId,
          registeredAt: registrationRecord.registeredAt,
        };
      },
      getDeliveryStatus: async (notificationId: string): Promise<{ status: string }> => {
        return { status: 'delivered' };
      },
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(mockScheduledNotifications).toHaveLength(1);
    const scheduledRecord = mockScheduledNotifications[0];
    expect(scheduledRecord.cronExpression).toBe('0 9 * * 1');
    expect(scheduledRecord.userCount).toBeGreaterThan(0);
    expect(scheduledRecord.notificationType).toBe('MORNING_REPORT_REMINDER');
    expect(scheduledRecord.status).toBe(200);
    expect(scheduledRecord.scheduleId).toMatch(/^sched-\d+$/);
    expect(scheduledRecord.registeredAt).toBe('2024-01-08T09:00:00Z');

    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(result.failedCount).toBeGreaterThanOrEqual(0);
    expect(result.remainingTimeMinutes).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.notificationDetails)).toBe(true);
  });
});