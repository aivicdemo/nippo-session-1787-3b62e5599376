import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendUnsubmittedMemberReminders } from '../../src/logic/reminder-notification-service';
import type {
  UnsubmittedMemberReminderInput,
  ReminderRetryRule,
  ReminderNotificationResult
} from '../../src/logic/reminder-notification-service';

describe('sendUnsubmittedMemberReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-627
  test('should skip sending reminder notification when same member has been reminded within 1 minute', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const thirtyMinutesLater = new Date('2024-01-15T09:30:00Z');
    const fortyFiveMinutesLater = new Date('2024-01-15T09:45:00Z');
    const fortySecondsAgo = new Date('2024-01-15T08:59:20Z');

    const reminderRetryRule: ReminderRetryRule = {
      initialNotificationMethod: 'email',
      maxRetryCount: 2,
      retryStages: [
        { stage: 1, method: 'slack', intervalMinutes: 10 },
        { stage: 2, method: 'phone', intervalMinutes: 5 }
      ]
    };

    const input: UnsubmittedMemberReminderInput = {
      teamId: 'team-001',
      unsubmittedMembers: [
        { userId: 'user-A', email: 'a@example.com', name: 'メンバーA' }
      ],
      reportingDeadlineTime: thirtyMinutesLater,
      morningMeetingStartTime: fortyFiveMinutesLater,
      reminderRetryRule: reminderRetryRule,
      previousReminderHistory: [
        {
          userId: 'user-A',
          sentAt: fortySecondsAgo,
          notificationMethod: 'email'
        }
      ]
    };

    const result: ReminderNotificationResult = await sendUnsubmittedMemberReminders(input);

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toEqual([]);
    expect(result.remainingTimeDisplay).toMatch(/残り(30|45)分/);
  });
});