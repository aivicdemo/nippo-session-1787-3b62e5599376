import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-367
  test('チームメンバーが1名の場合、その1名に対してリマインド通知が送信される', async () => {
    const scheduled_time = new Date('2024-01-15T09:00:00Z');
    const report_deadline_time = new Date('2024-01-15T09:30:00Z');
    const team_id_1 = 'team-001';
    const user_id_1 = 'user-001';
    const user_name_1 = 'Alice';
    const user_email_1 = 'alice@example.com';

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduled_time,
      teamIds: [team_id_1],
      reportDeadlineTime: report_deadline_time,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const notification_detail: ReminderNotificationDetail = {
      userId: user_id_1,
      status: 'sent',
      sentAt: new Date('2024-01-15T09:00:15Z'),
      errorMessage: null,
    };

    const mock_adapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        notificationId: 'notif-001',
        deliveryStatus: 'sent',
        sentAt: new Date('2024-01-15T09:00:15Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mock_adapter,
      {
        getTeamMembers: jest.fn().mockResolvedValue([
          {
            userId: user_id_1,
            userName: user_name_1,
            email: user_email_1,
            teamId: team_id_1,
          },
        ]),
        recordNotificationLog: jest.fn().mockResolvedValue({
          logId: 'log-001',
          userId: user_id_1,
          teamId: team_id_1,
          sentAt: new Date('2024-01-15T09:00:15Z'),
          status: 'sent',
          channels: ['email', 'in_app', 'slack'],
        }),
        getUnsubmittedMembers: jest.fn().mockResolvedValue([]),
      }
    );

    expect(mock_adapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mock_adapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user_id_1,
        userName: user_name_1,
        email: user_email_1,
      }),
      expect.objectContaining({
        channels: ['email', 'in_app', 'slack'],
      })
    );

    expect(output.sentCount).toBe(1);
    expect(output.failedCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(30);
    expect(output.notificationDetails).toHaveLength(1);
    expect(output.notificationDetails[0]).toMatchObject({
      userId: user_id_1,
      status: 'sent',
      sentAt: new Date('2024-01-15T09:00:15Z'),
    });
  });
});