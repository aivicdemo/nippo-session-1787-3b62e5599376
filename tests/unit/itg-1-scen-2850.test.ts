import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('未提出メンバー催促通知機能 - 冪等性検証', () => {
  test('SCEN-2850: 同じ未提出メンバー集合に対して2回実行しても、同じ対象者に対して催促通知が送信される', async () => {
    const fixed_now = new Date('2026-08-20T09:00:00Z');
    const team_id = 'team-001';
    const report_date = '2026-08-20';
    const request_user_id = 'user-director-001';

    const unsubmitted_members = [
      {
        userId: 'user-member-a',
        userName: 'Member A',
        email: 'member-a@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-member-b',
        userName: 'Member B',
        email: 'member-b@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-member-c',
        userName: 'Member C',
        email: 'member-c@example.com',
        remainingMinutes: 30,
      },
    ];

    const send_reminder_call_records_first: Array<{ userId: string }> = [];
    const send_reminder_call_records_second: Array<{ userId: string }> = [];

    const stub_notification_adapter_first: NotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockImplementation(async (user_id: string) => {
          send_reminder_call_records_first.push({ userId: user_id });
          return {
            status: 'sent' as const,
            sentAt: fixed_now,
            errorMessage: null,
          };
        }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input_first = {
      teamId: team_id,
      reportDate: report_date,
      requestUserId: request_user_id,
      unsubmittedMembers: unsubmitted_members,
      notificationChannels: ['email' as const],
    };

    const result_first = await detectAndNotifyUnsubmittedMembers(
      input_first,
      stub_notification_adapter_first
    );

    expect(result_first.notificationsSent).toBe(3);
    expect(result_first.notificationFailures.length).toBe(0);
    expect(send_reminder_call_records_first.length).toBe(3);
    expect(send_reminder_call_records_first.map((r) => r.userId).sort()).toEqual(
      ['user-member-a', 'user-member-b', 'user-member-c'].sort()
    );

    send_reminder_call_records_second.length = 0;

    const stub_notification_adapter_second: NotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockImplementation(async (user_id: string) => {
          send_reminder_call_records_second.push({ userId: user_id });
          return {
            status: 'sent' as const,
            sentAt: fixed_now,
            errorMessage: null,
          };
        }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input_second = {
      teamId: team_id,
      reportDate: report_date,
      requestUserId: request_user_id,
      unsubmittedMembers: unsubmitted_members,
      notificationChannels: ['email' as const],
    };

    const result_second = await detectAndNotifyUnsubmittedMembers(
      input_second,
      stub_notification_adapter_second
    );

    expect(result_second.notificationsSent).toBe(3);
    expect(result_second.notificationFailures.length).toBe(0);
    expect(send_reminder_call_records_second.length).toBe(3);
    expect(send_reminder_call_records_second.map((r) => r.userId).sort()).toEqual(
      ['user-member-a', 'user-member-b', 'user-member-c'].sort()
    );

    expect(send_reminder_call_records_first.length).toBe(
      send_reminder_call_records_second.length
    );
    expect(send_reminder_call_records_first.map((r) => r.userId).sort()).toEqual(
      send_reminder_call_records_second.map((r) => r.userId).sort()
    );
  });
});