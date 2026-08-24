import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-381
  test('NotificationServiceAdapter.sendReminderNotification が失敗を返したとき、内部キューに保存して再試行ロジックに委譲される', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        success: false,
        error: 'API_ERROR',
        userId: 'user-001',
        channel: 'email',
      })),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockQueueStore = {
      save: jest.fn(async (queueItem) => ({
        id: 'queue-item-001',
        ...queueItem,
      })),
      findByStatus: jest.fn(async (status) => []),
    };

    const mockRetryScheduler = {
      scheduleRetry: jest.fn(async (queueItemId, nextRetryTime) => ({
        jobId: 'retry-job-001',
        queueItemId,
        nextRetryTime,
      })),
    };

    const result = await sendDailyReportReminder(
      input,
      mockNotificationAdapter,
      mockQueueStore,
      mockRetryScheduler
    );

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(String),
        channel: 'email',
        remainingMinutes: expect.any(Number),
      })
    );

    expect(mockQueueStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        status: 'QUEUED_FOR_RETRY',
        failureReason: 'API_ERROR',
        retryCount: 0,
        nextRetryTime: expect.any(Date),
      })
    );

    const savedQueueItem = mockQueueStore.save.mock.calls[0][0];
    const nextRetryTime = new Date(scheduledTime.getTime() + 5 * 60 * 1000);
    expect(savedQueueItem.nextRetryTime.getTime()).toBeLessThanOrEqual(
      nextRetryTime.getTime() + 1000
    );
    expect(savedQueueItem.nextRetryTime.getTime()).toBeGreaterThanOrEqual(
      nextRetryTime.getTime() - 1000
    );

    expect(mockRetryScheduler.scheduleRetry).toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({
        failedCount: expect.any(Number),
        sentCount: expect.any(Number),
        remainingTimeMinutes: 30,
        notificationDetails: expect.any(Array),
      })
    );

    const failedDetail = result.notificationDetails.find(
      (detail: ReminderNotificationDetail) => detail.status === 'failed'
    );
    expect(failedDetail).toBeDefined();
    expect(failedDetail?.errorMessage).toBeTruthy();
  });
});