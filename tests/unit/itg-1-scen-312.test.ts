import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';
import type { DailyReminderInput } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム', () => {
  test('SCEN-312: 報告期限が現在時刻より前の場合、InvalidDeadlineCalculationError をスロー', () => {
    const executionTimestamp = new Date('2026-08-19T08:30:00Z');
    const reportDeadlineDateTime = new Date('2026-08-19T08:00:00Z');

    const input: DailyReminderInput = {
      teamId: 'team-001',
      reportDeadlineDateTime: reportDeadlineDateTime,
      executionTimestamp: executionTimestamp,
      notificationChannels: [
        {
          channelType: 'email',
          isEnabled: true,
        },
      ],
    };

    expect(() => sendDailyReminderNotifications(input)).toThrow(/報告期限の設定が不正です。現在時刻より後の時刻を指定してください/);
  });
});