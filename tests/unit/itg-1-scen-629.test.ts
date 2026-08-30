import { sendUnsubmittedMemberReminders } from '../../src/logic/reminder-notification-service';
import type {
  UnsubmittedMemberReminderInput,
  UnsubmittedMember,
  ReminderRetryRule,
  RetryStage,
} from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - 未提出メンバー催促通知', () => {
  // SCEN-629: 朝会開始予定時刻が現在時刻より過去に設定されている場合、DeadlineCalculationErrorが発生する
  test('should throw DeadlineCalculationError when morningMeetingStartTime is in the past', () => {
    const currentDateTime = new Date('2026-08-19T10:00:00Z');
    const morningMeetingStartTime = new Date('2026-08-19T09:00:00Z');
    const reportingDeadlineTime = new Date('2026-08-19T09:30:00Z');

    const unsubmittedMember: UnsubmittedMember = {
      memberId: 'user-001',
      memberEmail: 'engineer@example.com',
      memberName: 'エンジニア太郎',
    };

    const retryStage: RetryStage = {
      stageNumber: 1,
      notificationMethod: 'email',
      waitTimeMinutes: 15,
    };

    const reminderRetryRule: ReminderRetryRule = {
      initialNotificationMethod: 'email',
      maxRetryCount: 2,
      retryStages: [retryStage],
    };

    const input: UnsubmittedMemberReminderInput = {
      teamId: 'team-001',
      unsubmittedMembers: [unsubmittedMember],
      reportingDeadlineTime: reportingDeadlineTime,
      morningMeetingStartTime: morningMeetingStartTime,
      reminderRetryRule: reminderRetryRule,
      previousReminderHistory: [],
    };

    expect(() => {
      sendUnsubmittedMemberReminders(input);
    }).toThrow(/期限設定/);
  });
});