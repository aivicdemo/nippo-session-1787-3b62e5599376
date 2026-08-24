import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, NotificationServiceAdapter } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - NotificationServiceAdapter failure handling', () => {
  // SCEN-291: [error] 朝会報告リマインド通知自動送信機能 - NotificationServiceAdapter の sendReminderNotification が失敗したとき内部キューへの一時保存が実行される
  test('should enqueue failed notification to internal queue when sendReminderNotification throws', async () => {
    const failureTimestamp = new Date('2024-01-15T08:30:00Z');
    const expectedQueuedSendTime = new Date('2024-01-15T08:35:00Z');

    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockImplementation(() => {
        throw new Error('Notification service unavailable');
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue([]),
    };

    const mockNotificationQueue: Array<{
      user_id: string;
      message_type: string;
      scheduled_send_time: Date;
      status: string;
      retry_count: number;
    }> = [];

    const mockNotificationDeliveryLogs: Array<{
      user_id: string;
      status: string;
      error_message: string;
      timestamp: Date;
    }> = [];

    let adminAlertScheduled = false;

    const mockQueueInsert = (record: {
      user_id: string;
      message_type: string;
      scheduled_send_time: Date;
      status: string;
      retry_count: number;
    }) => {
      mockNotificationQueue.push(record);
    };

    const mockLogInsert = (record: {
      user_id: string;
      status: string;
      error_message: string;
      timestamp: Date;
    }) => {
      mockNotificationDeliveryLogs.push(record);
    };

    const mockScheduleAlert = () => {
      adminAlertScheduled = true;
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationAdapter,
      mockQueueInsert,
      mockLogInsert,
      mockScheduleAlert,
      failureTimestamp
    );

    expect(mockNotificationQueue).toHaveLength(1);
    expect(mockNotificationQueue[0]).toEqual({
      user_id: expect.any(String),
      message_type: 'reminder',
      scheduled_send_time: expectedQueuedSendTime,
      status: 'pending',
      retry_count: 0,
    });

    expect(mockNotificationDeliveryLogs).toHaveLength(1);
    expect(mockNotificationDeliveryLogs[0]).toEqual({
      user_id: expect.any(String),
      status: 'failed',
      error_message: 'Notification service unavailable',
      timestamp: failureTimestamp,
    });

    expect(adminAlertScheduled).toBe(false);

    expect(result.failedCount).toBeGreaterThan(0);
    expect(result.sentCount).toEqual(0);
  });
});