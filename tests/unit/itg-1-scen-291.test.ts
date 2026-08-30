import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - 日報リマインド通知', () => {
  // SCEN-291
  test('報告期限が現在時刻より前のときに不正エラーを発生させる', () => {
    const teamId = 'team-001';
    const executionTimestamp = new Date('2026-08-20T08:30:00Z');
    const reportDeadlineDateTime = new Date('2026-08-20T08:00:00Z');
    const notificationChannels = [
      {
        channelType: 'email',
        isEnabled: true,
      },
    ];

    expect(() => {
      sendDailyReminderNotifications({
        teamId,
        reportDeadlineDateTime,
        executionTimestamp,
        notificationChannels,
      });
    }).toThrow(/報告期限/);
  });
});