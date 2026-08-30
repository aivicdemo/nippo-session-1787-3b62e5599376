import { sendUnsubmittedMemberReminders } from '../../src/logic/reminder-notification-service';
import type { UnsubmittedMemberReminderInput, ReminderRetryRule } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - 未提出メンバー催促通知', () => {
  // SCEN-631: チームメンバーIDリストが空のときの警告ログ生成と正常完了
  test('unsubmittedMembersが空配列のとき、警告を発生させつつ正常に完了する', () => {
    const now = new Date('2024-01-15T07:00:00Z');
    const reportingDeadlineTime = new Date('2024-01-15T07:30:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T08:00:00Z');

    const reminderRetryRule: ReminderRetryRule = {
      initialNotificationMethod: 'email',
      maxRetryCount: 2,
      retryStages: [
        { stageNumber: 1, notificationMethod: 'push', waitingTimeMinutes: 15 },
        { stageNumber: 2, notificationMethod: 'both', waitingTimeMinutes: 30 },
      ],
    };

    const input: UnsubmittedMemberReminderInput = {
      teamId: 'team-001',
      unsubmittedMembers: [],
      reportingDeadlineTime,
      morningMeetingStartTime,
      reminderRetryRule,
      previousReminderHistory: null,
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = sendUnsubmittedMemberReminders(input);

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toEqual([]);
    expect(result.remainingTimeDisplay).toBe('残り30分');

    expect(consoleWarnSpy).toHaveBeenCalled();
    const warnCall = consoleWarnSpy.mock.calls.find((call) =>
      typeof call[0] === 'string' && call[0].includes('チームメンバー')
    );
    expect(warnCall).toBeDefined();

    consoleWarnSpy.mockRestore();
  });
});