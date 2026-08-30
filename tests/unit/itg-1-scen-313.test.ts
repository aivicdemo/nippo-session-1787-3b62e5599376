import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - リマインド通知サービス', () => {
  // SCEN-313: 定時リマインド送信スケジュール時刻が営業日でない（土日祝日）のときという明示された境界条件で本日は営業日ではないため、リマインド通知は送信されません
  test('土曜日の定時リマインド送信時にはリマインド通知を送信しない', () => {
    // 2025年1月4日は土曜日
    const executionTimestamp = new Date('2025-01-04T08:30:00Z');
    const reportDeadlineDateTime = new Date('2025-01-04T09:00:00Z');
    const teamId = 'team-001';
    const notificationChannels = [
      { channelType: 'email', isEnabled: true },
      { channelType: 'slack', isEnabled: true }
    ];

    const result = sendDailyReminderNotifications(
      teamId,
      reportDeadlineDateTime,
      executionTimestamp,
      notificationChannels
    );

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toEqual([]);
    expect(result.remainingTimeDisplay).toBe('');
  });
});