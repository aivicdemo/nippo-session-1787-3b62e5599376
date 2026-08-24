import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-299: [edge] リマインド通知自動送信機能 - チームメンバーが業務上の最大規模（1000名）の場合、全員への通知送信が完了する
  test('1000名全員への通知送信が10秒以内に完了し、送信ステータスがすべてsuccess', async () => {
    const scheduled_time = new Date('2024-01-15T08:30:00Z');
    const deadline_time = new Date('2024-01-15T09:00:00Z');
    const team_ids = ['team-001'];
    const notification_channels: ('email' | 'in_app' | 'slack')[] = ['email', 'in_app', 'slack'];

    const member_count = 1000;
    const mock_user_ids = Array.from({ length: member_count }, (_, i) => `user-${String(i + 1).padStart(4, '0')}`);

    const mock_notification_service_adapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:05Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduled_time,
      teamIds: team_ids,
      reportDeadlineTime: deadline_time,
      notificationChannels: notification_channels,
    };

    const start_time = Date.now();
    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mock_notification_service_adapter
    );
    const end_time = Date.now();

    const execution_time_seconds = (end_time - start_time) / 1000;

    expect(result.sentCount).toBe(member_count);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);

    expect(result.notificationDetails).toHaveLength(member_count);

    const success_details = result.notificationDetails.filter(
      (detail: ReminderNotificationDetail) => detail.status === 'sent'
    );
    expect(success_details).toHaveLength(member_count);

    result.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toEqual(new Date('2024-01-15T08:30:05Z'));
      expect(detail.errorMessage).toBeNull();
    });

    expect(mock_notification_service_adapter.sendReminderNotification).toHaveBeenCalledTimes(member_count);

    expect(execution_time_seconds).toBeLessThan(10);
  });
});