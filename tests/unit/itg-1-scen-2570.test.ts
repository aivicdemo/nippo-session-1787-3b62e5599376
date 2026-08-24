import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - 報告期限残り時間表示機能', () => {
  test('SCEN-2570: 報告期限までの残り時間が1分以上（1分00秒）で「1分」と表示される', () => {
    // セットアップ: 固定時刻での期限設定
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    
    // ケース1: 残り時間が1分00秒（08:59:00）
    const scheduledTimeAtOneMintBefore = new Date('2024-01-15T08:59:00Z');
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'in_app'];
    const teamIds = ['team-001'];

    const input1: SendDailyReportReminderInput = {
      scheduledTime: scheduledTimeAtOneMintBefore,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result1 = sendDailyReportReminder(input1);
    
    // 期限までの残り時間は1分（60秒）
    expect(result1.remainingTimeMinutes).toBe(1);
    expect(result1.sentCount).toBeGreaterThanOrEqual(0);
    expect(result1.failedCount).toBeGreaterThanOrEqual(0);

    // ケース2: 残り時間が0分00秒（09:00:00）- 期限到達時点
    const scheduledTimeAtDeadline = new Date('2024-01-15T09:00:00Z');
    
    const input2: SendDailyReportReminderInput = {
      scheduledTime: scheduledTimeAtDeadline,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result2 = sendDailyReportReminder(input2);
    
    // 期限到達時点では残り時間は0分
    expect(result2.remainingTimeMinutes).toBe(0);

    // ケース3: 残り時間が負数（09:00:01）- 期限超過
    const scheduledTimeAfterDeadline = new Date('2024-01-15T09:00:01Z');
    
    const input3: SendDailyReportReminderInput = {
      scheduledTime: scheduledTimeAfterDeadline,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result3 = sendDailyReportReminder(input3);
    
    // 期限超過時は残り時間が負数
    expect(result3.remainingTimeMinutes).toBe(-1);

    // 返却値の型と構造を検証
    expect(result1).toHaveProperty('sentCount');
    expect(result1).toHaveProperty('failedCount');
    expect(result1).toHaveProperty('remainingTimeMinutes');
    expect(result1).toHaveProperty('notificationDetails');
    expect(Array.isArray(result1.notificationDetails)).toBe(true);

    // notificationDetails の各要素が正しい構造を持つか確認
    result1.notificationDetails.forEach((detail) => {
      expect(detail).toHaveProperty('userId');
      expect(detail).toHaveProperty('status');
      expect(['sent', 'failed', 'skipped']).toContain(detail.status);
    });
  });
});