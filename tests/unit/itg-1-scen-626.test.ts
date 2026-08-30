import { sendUnsubmittedMemberReminders } from '../../src/logic/reminder-notification-service';
import type { UnsubmittedMemberReminderInput, ReminderRetryRule } from '../../src/logic/reminder-notification-service';

describe('sendUnsubmittedMemberReminders', () => {
  // SCEN-626: [error] 報告期限前に未提出メンバーを検出して段階的な催促通知を送信し、再催促ルールに基づいて通知方法を変更する - 朝会開始予定時刻が報告期限時刻より前に設定されているときという明示された境界条件で朝会開始時刻が報告期限より前です。設定を確認してください
  test('should throw DeadlineCalculationError when morning meeting start time is before reporting deadline', () => {
    const reminderRetryRule: ReminderRetryRule = {
      initialNotificationMethod: 'email',
      maxRetryCount: 2,
      retryStages: [
        { stageNumber: 1, notificationMethod: 'slack', waitTimeMinutes: 10 },
        { stageNumber: 2, notificationMethod: 'phone', waitTimeMinutes: 5 },
      ],
    };

    const input: UnsubmittedMemberReminderInput = {
      teamId: 'team-001',
      unsubmittedMembers: [
        {
          userId: 'user-001',
          email: 'user1@example.com',
          name: '田中太郎',
        },
      ],
      reportingDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T08:30:00Z'),
      reminderRetryRule,
      previousReminderHistory: [],
    };

    expect(() => sendUnsubmittedMemberReminders(input)).toThrow(/朝会開始時刻/);
  });
});