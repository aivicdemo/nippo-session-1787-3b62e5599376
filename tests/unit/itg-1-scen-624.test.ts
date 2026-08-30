import { sendUnsubmittedMemberReminders } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - 未提出メンバー催促通知サービス', () => {
  // SCEN-624: 連絡先情報が不完全な場合の催促通知送信失敗テスト
  test('未提出メンバーのメールアドレスが登録されていない場合、催促通知送信に失敗し failureCount=1 を返す', () => {
    const teamId = 'team-001';
    const reportingDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');
    const currentTimeAt = new Date('2024-01-15T08:30:00Z');

    const unsubmittedMembers = [
      {
        memberId: 'user-005',
        memberName: '田中太郎',
        memberEmail: null,
        reportDeadline: reportingDeadlineTime,
        reminderStage: 'first' as const,
        teamName: 'Engineering Team',
      },
    ];

    const reminderRetryRule = {
      initialNotificationMethod: 'email' as const,
      maxRetryCount: 2,
      retryStages: [
        {
          stageNumber: 1,
          notificationMethod: 'slack' as const,
          waitIntervalMinutes: 10,
        },
      ],
    };

    const previousReminderHistory = [];

    const result = sendUnsubmittedMemberReminders(
      teamId,
      unsubmittedMembers,
      reportingDeadlineTime,
      morningMeetingStartTime,
      reminderRetryRule,
      previousReminderHistory,
      currentTimeAt
    );

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
    expect(result.notificationHistoryIds).toEqual([]);
    expect(result.remainingTimeDisplay).toBe('残り0時間30分');
  });
});