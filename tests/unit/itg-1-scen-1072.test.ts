import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-1072: [error] リマインド通知自動送信機能 - NotificationServiceAdapter.sendReminderNotification が失敗したとき、内部キューに保存される
  test('should queue failed reminder notifications with QUEUED status and 5 minute retry interval', async () => {
    const baseTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = baseTime;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValueOnce(
        new Error('Network timeout')
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockQueueStore: Array<{
      user_id: string;
      status: string;
      notification_type: string;
      created_at: Date;
      retry_count: number;
      next_retry_time: Date;
    }> = [];

    const mockQueueManager = {
      enqueue: jest.fn((record: {
        user_id: string;
        status: string;
        notification_type: string;
        created_at: Date;
        retry_count: number;
        next_retry_time: Date;
      }) => {
        mockQueueStore.push(record);
        return Promise.resolve();
      }),
      dequeue: jest.fn(),
      retryQueue: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['TEAM_001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'slack'],
    };

    const currentTime = new Date('2024-01-15T08:30:00Z');
    const expectedRetryTime = new Date(currentTime.getTime() + 5 * 60 * 1000);

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockQueueManager
    );

    expect(output.failedCount).toBe(1);
    expect(output.sentCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(30);

    expect(mockQueueStore).toHaveLength(1);
    const queuedRecord = mockQueueStore[0];

    expect(queuedRecord.user_id).toBe('U001');
    expect(queuedRecord.status).toBe('QUEUED');
    expect(queuedRecord.notification_type).toBe('REMINDER');
    expect(queuedRecord.retry_count).toBe(0);

    const timeDiffMs = queuedRecord.next_retry_time.getTime() - expectedRetryTime.getTime();
    expect(Math.abs(timeDiffMs)).toBeLessThan(1000);

    expect(mockQueueManager.enqueue).toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});