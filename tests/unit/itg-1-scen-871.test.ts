import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - Submission Status Tracking', () => {
  // SCEN-871: [error] リマインド通知自動送信機能 - NotificationServiceAdapterのsendReminderNotificationが失敗したときエラーになる
  test('should handle NotificationServiceAdapter failure and record failed delivery with retry scheduling', async () => {
    const scheduled_time = new Date('2024-01-15T08:30:00Z');
    const report_deadline_time = new Date('2024-01-15T09:00:00Z');
    const team_ids = ['team-001', 'team-002'];
    const notification_channels = ['email', 'slack'] as const;

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduled_time,
      teamIds: team_ids,
      reportDeadlineTime: report_deadline_time,
      notificationChannels: notification_channels,
    };

    const failed_user_id_1 = 'user-001';
    const failed_user_id_2 = 'user-002';
    const failed_user_id_3 = 'user-003';

    const mock_notification_service_adapter = {
      sendReminderNotification: jest.fn()
        .mockResolvedValueOnce({
          success: false,
          error: 'API_ERROR',
          statusCode: 500,
          userId: failed_user_id_1,
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'API_ERROR',
          statusCode: 500,
          userId: failed_user_id_2,
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'API_ERROR',
          statusCode: 500,
          userId: failed_user_id_3,
        }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 0,
        failed: 3,
        pending: 0,
      }),
    };

    const mock_retry_queue_service = {
      registerRetry: jest.fn().mockResolvedValue({ queueId: 'retry-queue-001' }),
      getRetryAttempts: jest.fn().mockResolvedValue([
        { attempt: 1, scheduledAt: new Date('2024-01-15T08:35:00Z'), status: 'pending' },
        { attempt: 2, scheduledAt: new Date('2024-01-15T08:45:00Z'), status: 'pending' },
        { attempt: 3, scheduledAt: new Date('2024-01-15T09:15:00Z'), status: 'pending' },
      ]),
    };

    const mock_notification_delivery_log_repository = {
      createFailedRecord: jest.fn()
        .mockResolvedValueOnce({
          id: 'log-001',
          userId: failed_user_id_1,
          deliveryStatus: 'failed',
          errorMessage: 'API_ERROR',
          statusCode: 500,
          recordedAt: new Date('2024-01-15T08:30:15Z'),
        })
        .mockResolvedValueOnce({
          id: 'log-002',
          userId: failed_user_id_2,
          deliveryStatus: 'failed',
          errorMessage: 'API_ERROR',
          statusCode: 500,
          recordedAt: new Date('2024-01-15T08:30:16Z'),
        })
        .mockResolvedValueOnce({
          id: 'log-003',
          userId: failed_user_id_3,
          deliveryStatus: 'failed',
          errorMessage: 'API_ERROR',
          statusCode: 500,
          recordedAt: new Date('2024-01-15T08:30:17Z'),
        }),
    };

    const mock_admin_alert_service = {
      sendAlert: jest.fn().mockResolvedValue({ alertId: 'alert-001' }),
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mock_notification_service_adapter, mock_retry_queue_service, mock_notification_delivery_log_repository, mock_admin_alert_service);

    expect(mock_notification_service_adapter.sendReminderNotification).toHaveBeenCalledTimes(3);
    expect(mock_notification_delivery_log_repository.createFailedRecord).toHaveBeenCalledTimes(3);

    const failed_log_call_1 = mock_notification_delivery_log_repository.createFailedRecord.mock.calls[0][0];
    expect(failed_log_call_1.userId).toBe(failed_user_id_1);
    expect(failed_log_call_1.deliveryStatus).toBe('failed');
    expect(failed_log_call_1.errorMessage).toBe('API_ERROR');

    const failed_log_call_2 = mock_notification_delivery_log_repository.createFailedRecord.mock.calls[1][0];
    expect(failed_log_call_2.userId).toBe(failed_user_id_2);
    expect(failed_log_call_2.deliveryStatus).toBe('failed');

    const failed_log_call_3 = mock_notification_delivery_log_repository.createFailedRecord.mock.calls[2][0];
    expect(failed_log_call_3.userId).toBe(failed_user_id_3);
    expect(failed_log_call_3.deliveryStatus).toBe('failed');

    expect(mock_retry_queue_service.registerRetry).toHaveBeenCalledTimes(3);

    const retry_call_1 = mock_retry_queue_service.registerRetry.mock.calls[0][0];
    expect(retry_call_1.userId).toBe(failed_user_id_1);
    expect(retry_call_1.attemptNumber).toBe(1);
    expect(retry_call_1.nextRetryInterval).toBe(5);

    const retry_call_2 = mock_retry_queue_service.registerRetry.mock.calls[1][0];
    expect(retry_call_2.userId).toBe(failed_user_id_2);
    expect(retry_call_2.attemptNumber).toBe(1);
    expect(retry_call_2.nextRetryInterval).toBe(5);

    const retry_call_3 = mock_retry_queue_service.registerRetry.mock.calls[2][0];
    expect(retry_call_3.userId).toBe(failed_user_id_3);
    expect(retry_call_3.attemptNumber).toBe(1);
    expect(retry_call_3.nextRetryInterval).toBe(5);

    expect(mock_admin_alert_service.sendAlert).not.toHaveBeenCalled();

    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(3);
    expect(result.remainingTimeMinutes).toBe(30);

    const expected_notification_details: ReminderNotificationDetail[] = [
      {
        userId: failed_user_id_1,
        status: 'failed',
        sentAt: null,
        errorMessage: 'API_ERROR',
      },
      {
        userId: failed_user_id_2,
        status: 'failed',
        sentAt: null,
        errorMessage: 'API_ERROR',
      },
      {
        userId: failed_user_id_3,
        status: 'failed',
        sentAt: null,
        errorMessage: 'API_ERROR',
      },
    ];

    expect(result.notificationDetails).toEqual(expect.arrayContaining(expected_notification_details));
    expect(result.notificationDetails.length).toBe(3);

    expect(result.notificationDetails.every(detail => detail.status === 'failed')).toBe(true);
    expect(result.notificationDetails.every(detail => detail.sentAt === null)).toBe(true);
  });
});