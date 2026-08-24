import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-390: [edge] 定時リマインド送信機能 - 月末日の朝8時30分にスケジュール発火し、翌営業日が月初日となるとき、対象メンバーリストが正しく取得される
  test('月末日8時30分の定時発火で翌営業日（月初日）のメンバーリストが正確に取得される', () => {
    const scheduled_time_month_end = new Date('2026-08-31T08:30:00+09:00');
    const report_deadline_time_month_end = new Date('2026-09-01T09:00:00+09:00');
    const team_ids = ['team-001'];
    const notification_channels = ['slack', 'in_app'] as const;

    const mock_members = [
      {
        user_id: 'user-001',
        user_name: 'Engineer A',
        email: 'engineer.a@example.com',
        is_active: true,
        notification_channel: 'slack' as const,
      },
      {
        user_id: 'user-002',
        user_name: 'Engineer B',
        email: 'engineer.b@example.com',
        is_active: true,
        notification_channel: 'slack' as const,
      },
      {
        user_id: 'user-003',
        user_name: 'Engineer C',
        email: 'engineer.c@example.com',
        is_active: true,
        notification_channel: 'in_app' as const,
      },
      {
        user_id: 'user-004',
        user_name: 'Engineer D',
        email: 'engineer.d@example.com',
        is_active: true,
        notification_channel: 'slack' as const,
      },
      {
        user_id: 'user-005',
        user_name: 'Engineer E',
        email: 'engineer.e@example.com',
        is_active: true,
        notification_channel: 'in_app' as const,
      },
      {
        user_id: 'user-006',
        user_name: 'Engineer F',
        email: 'engineer.f@example.com',
        is_active: true,
        notification_channel: 'slack' as const,
      },
      {
        user_id: 'user-007',
        user_name: 'Engineer G',
        email: 'engineer.g@example.com',
        is_active: true,
        notification_channel: 'slack' as const,
      },
      {
        user_id: 'user-008',
        user_name: 'Engineer H',
        email: 'engineer.h@example.com',
        is_active: true,
        notification_channel: 'in_app' as const,
      },
      {
        user_id: 'user-009',
        user_name: 'Engineer I',
        email: 'engineer.i@example.com',
        is_active: true,
        notification_channel: 'slack' as const,
      },
      {
        user_id: 'user-010',
        user_name: 'Engineer J',
        email: 'engineer.j@example.com',
        is_active: true,
        notification_channel: 'in_app' as const,
      },
    ];

    let captured_members_list: typeof mock_members | null = null;
    let schedule_notification_called = false;

    const stub_notification_service = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'sent' as const,
        sent_at: new Date('2026-09-01T08:30:00+09:00'),
      })),
      scheduleNotification: jest.fn(async (members_to_notify: typeof mock_members, deadline: Date) => {
        schedule_notification_called = true;
        captured_members_list = members_to_notify;
        return {
          scheduled_count: members_to_notify.length,
          scheduled_at: scheduled_time_month_end,
        };
      }),
      getDeliveryStatus: jest.fn(async () => ({
        sent_count: 10,
        failed_count: 0,
        pending_count: 0,
      })),
    };

    const input: SendDailyReportReminderInput = {
      scheduled_time: scheduled_time_month_end,
      team_ids: team_ids,
      report_deadline_time: report_deadline_time_month_end,
      notification_channels: notification_channels,
    };

    const result = sendDailyReportReminder(input, stub_notification_service as any);

    expect(result).toBeDefined();
    expect(schedule_notification_called).toBe(true);
    expect(captured_members_list).not.toBeNull();
    expect(captured_members_list).toHaveLength(10);

    if (captured_members_list) {
      const all_active = captured_members_list.every((member) => member.is_active === true);
      expect(all_active).toBe(true);

      const has_user_001 = captured_members_list.some((member) => member.user_id === 'user-001');
      expect(has_user_001).toBe(true);

      const slack_channel_members = captured_members_list.filter((member) => member.notification_channel === 'slack');
      expect(slack_channel_members.length).toBe(6);

      const in_app_channel_members = captured_members_list.filter((member) => member.notification_channel === 'in_app');
      expect(in_app_channel_members.length).toBe(4);

      const has_email_field = captured_members_list.every((member) => member.email && member.email.length > 0);
      expect(has_email_field).toBe(true);

      const has_user_name_field = captured_members_list.every((member) => member.user_name && member.user_name.length > 0);
      expect(has_user_name_field).toBe(true);
    }

    expect(stub_notification_service.scheduleNotification).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ user_id: expect.any(String) })]),
      expect.any(Date)
    );
  });
});