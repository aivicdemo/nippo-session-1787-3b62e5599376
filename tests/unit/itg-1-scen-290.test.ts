import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - 定時リマインド通知', () => {
  // SCEN-290
  test('チームメンバーIDの一覧が空のとき、EmptyRecipientListError エラーを発生させる', () => {
    const teamId = 'team-001';
    const reportDeadlineDateTime = new Date('2026-08-20T09:00:00Z');
    const executionTimestamp = new Date('2026-08-20T08:30:00Z');
    const notificationChannels = [
      { channelType: 'email', isEnabled: true },
      { channelType: 'in_app_notification', isEnabled: true }
    ];

    expect(() =>
      sendDailyReminderNotifications({
        teamId,
        reportDeadlineDateTime,
        executionTimestamp,
        notificationChannels
      })
    ).toThrow(/通知対象のチームメンバーが見つかりません/);
  });
});