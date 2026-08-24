import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Scheduling', () => {
  // SCEN-1106: [edge] リマインド通知スケジュール機能 - 定時リマインド通知がちょうど指定時刻に送信される
  test('should send reminder notification at precisely scheduled time with tolerance of 100ms', async () => {
    jest.useFakeTimers();

    const scheduled_time = new Date('2024-01-15T09:00:00.000Z');
    const report_deadline_time = new Date('2024-01-15T09:30:00Z');
    const team_ids = ['team-001', 'team-002'];
    const notification_channels: Array<'email' | 'in_app' | 'slack'> = ['email', 'in_app'];

    const actual_send_times: Date[] = [];
    let schedule_registered_time: Date | null = null;

    const stub_notification_service = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channel: 'email' | 'in_app' | 'slack') => {
        const current_time = new Date();
        actual_send_times.push(current_time);
        return { success: true, sentAt: current_time };
      }),
      scheduleNotification: jest.fn(async (trigger_time: Date) => {
        schedule_registered_time = new Date(trigger_time);
        return { scheduled: true };
      }),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'sent',
        count: 1
      }))
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduled_time,
      teamIds: team_ids,
      reportDeadlineTime: report_deadline_time,
      notificationChannels: notification_channels
    };

    jest.setSystemTime(scheduled_time);

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(input, stub_notification_service);

    const time_difference_ms = Math.abs(actual_send_times[0].getTime() - scheduled_time.getTime());

    expect(time_difference_ms).toBeLessThanOrEqual(100);
    expect(schedule_registered_time).toEqual(scheduled_time);
    expect(output.sentCount).toBeGreaterThan(0);
    expect(output.remainingTimeMinutes).toBe(30);
    expect(output.notificationDetails).toBeInstanceOf(Array);
    expect(output.notificationDetails.length).toBeGreaterThan(0);

    output.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).not.toBeNull();
      expect(detail.sentAt!.getTime()).toBeGreaterThanOrEqual(scheduled_time.getTime() - 100);
      expect(detail.sentAt!.getTime()).toBeLessThanOrEqual(scheduled_time.getTime() + 100);
    });

    jest.useRealTimers();
  });
});