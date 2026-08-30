import { describe, test, expect } from '@jest/globals';
import { sendUnsubmittedMemberReminders } from '../../src/logic/reminder-notification-service';
import type { UnsubmittedMemberReminderInput, ReminderRetryRule, UnsubmittedMember } from '../../src/logic/reminder-notification-service';

describe('sendUnsubmittedMemberReminders', () => {
  // SCEN-079
  test('should throw DeadlineCalculationError when reportingDeadlineTime is invalid', () => {
    const unsubmittedMembers: UnsubmittedMember[] = [
      {
        memberId: 'ENG001',
        memberName: 'Engineer One',
        memberEmail: 'engineer1@example.com'
      }
    ];

    const reminderRetryRule: ReminderRetryRule = {
      initialNotificationMethod: 'email',
      maxRetryCount: 2,
      retryStages: [
        {
          stageNumber: 1,
          notificationMethod: 'push',
          waitMinutes: 120
        }
      ]
    };

    const futureTime = new Date(Date.now() + 3600000);

    const invalidReminderInput: UnsubmittedMemberReminderInput = {
      teamId: 'TEAM001',
      unsubmittedMembers: unsubmittedMembers,
      reportingDeadlineTime: new Date('invalid-date'),
      morningMeetingStartTime: futureTime,
      reminderRetryRule: reminderRetryRule,
      previousReminderHistory: []
    };

    expect(() => sendUnsubmittedMemberReminders(invalidReminderInput)).toThrow(/報告期限/);
  });
});