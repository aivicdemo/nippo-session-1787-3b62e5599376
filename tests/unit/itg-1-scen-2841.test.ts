import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput, NotificationFailure } from '../../src/logic/submission-status-tracking';

// Mock types for NotificationServiceAdapter
interface NotificationServiceAdapterMock {
  sendReminderNotification: jest.Mock;
  scheduleNotification: jest.Mock;
  getDeliveryStatus: jest.Mock;
}

describe('detectAndNotifyUnsubmittedMembers -催促方法自動判定（朝会30分前トリガー）', () => {
  // SCEN-2841
  test('should select Slack/Teams notification method at 30 minutes before morning meeting start time and execute API call', async () => {
    // Setup: Constants
    const MEETING_START_TIME_09_00 = '09:00';
    const CURRENT_TIME_08_30 = new Date('2024-01-15T08:30:00Z');
    const REPORT_DATE = '2024-01-15';
    const TEAM_ID = 'team-001';
    const EXECUTOR_USER_ID = 'user-executor-001';
    const TOTAL_MEMBERS = 10;
    const UNSUBMITTED_MEMBER_COUNT = 3;
    const MEETING_START_TIMESTAMP = new Date('2024-01-15T09:00:00Z');
    const THIRTY_MINUTES_BEFORE = 30;

    // Prepare: Create mock NotificationServiceAdapter
    const notificationServiceAdapterMock: NotificationServiceAdapterMock = {
      sendReminderNotification: jest.fn(async (userId: string, notificationChannels: string[]) => {
        return {
          status: 'sent' as const,
          sentAt: CURRENT_TIME_08_30,
          userId: userId,
        };
      }),
      scheduleNotification: jest.fn(async () => ({})),
      getDeliveryStatus: jest.fn(async () => ({})),
    };

    // Prepare: Mock unsubmitted members
    const unsubmittedMembers = [
      {
        userId: 'user-002',
        userName: 'Engineer A',
        email: 'engineer-a@company.com',
        remainingMinutes: THIRTY_MINUTES_BEFORE,
      },
      {
        userId: 'user-003',
        userName: 'Engineer B',
        email: 'engineer-b@company.com',
        remainingMinutes: THIRTY_MINUTES_BEFORE,
      },
      {
        userId: 'user-004',
        userName: 'Engineer C',
        email: 'engineer-c@company.com',
        remainingMinutes: THIRTY_MINUTES_BEFORE,
      },
    ];

    // Prepare: Input data
    const input: DetectUnsubmittedMembersInput = {
      teamId: TEAM_ID,
      reportDate: REPORT_DATE,
      morningMeetingStartTime: MEETING_START_TIME_09_00,
      executorUserId: EXECUTOR_USER_ID,
    };

    // Execute: Call the function
    const result: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      notificationServiceAdapterMock as any,
      () => CURRENT_TIME_08_30
    );

    // Verify: Basic result structure
    expect(result).toBeDefined();
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.notificationsSent).toBeGreaterThan(0);
    expect(result.notificationFailures).toBeDefined();
    expect(Array.isArray(result.notificationFailures)).toBe(true);
    expect(result.executedAt).toBeDefined();

    // Verify: Unsubmitted members detection
    expect(result.unsubmittedMembers.length).toBe(UNSUBMITTED_MEMBER_COUNT);
    expect(result.unsubmittedMembers[0].userId).toBe('user-002');
    expect(result.unsubmittedMembers[1].userId).toBe('user-003');
    expect(result.unsubmittedMembers[2].userId).toBe('user-004');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(THIRTY_MINUTES_BEFORE);

    // Verify: NotificationServiceAdapter was called with Slack/Teams channels
    expect(notificationServiceAdapterMock.sendReminderNotification).toHaveBeenCalled();
    const callCount = notificationServiceAdapterMock.sendReminderNotification.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(UNSUBMITTED_MEMBER_COUNT);

    // Verify: Each call includes Slack/Teams in notification channels
    for (let i = 0; i < Math.min(callCount, UNSUBMITTED_MEMBER_COUNT); i++) {
      const callArgs = notificationServiceAdapterMock.sendReminderNotification.mock.calls[i];
      expect(callArgs).toBeDefined();
      expect(callArgs.length).toBeGreaterThan(0);
      const userId = callArgs[0];
      expect(['user-002', 'user-003', 'user-004']).toContain(userId);

      // Verify: Notification channels contain Slack or Teams
      if (callArgs.length > 1) {
        const channels = callArgs[1];
        if (Array.isArray(channels)) {
          const hasSlackOrTeams = channels.includes('slack') || channels.includes('teams');
          expect(hasSlackOrTeams).toBe(true);
        }
      }
    }

    // Verify: Notifications were sent (not failed)
    expect(result.notificationsSent).toBe(UNSUBMITTED_MEMBER_COUNT);
    expect(result.notificationFailures.length).toBe(0);

    // Verify: Executed timestamp is recorded in ISO 8601 format
    const executedDate = new Date(result.executedAt);
    expect(executedDate.getTime()).toBeGreaterThanOrEqual(CURRENT_TIME_08_30.getTime());
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.executedAt)).toBe(true);

    // Verify: Each unsubmitted member has correct structure
    for (const member of result.unsubmittedMembers) {
      expect(member.userId).toBeDefined();
      expect(typeof member.userId).toBe('string');
      expect(member.userName).toBeDefined();
      expect(typeof member.userName).toBe('string');
      expect(member.email).toBeDefined();
      expect(typeof member.email).toBe('string');
      expect(member.remainingMinutes).toBe(THIRTY_MINUTES_BEFORE);
    }
  });
});