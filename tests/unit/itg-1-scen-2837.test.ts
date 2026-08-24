import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('detectAndNotifyUnsubmittedMembers - Month-start deadline edge case', () => {
  let originalNow: () => number;

  beforeEach(() => {
    originalNow = Date.now;
    jest.clearAllMocks();
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  // SCEN-2837: [edge] 未提出メンバー優先度判定機能 - 報告期限が月初日00時00分00秒の場合、その30分前の判定が正確に実行される
  test('should correctly identify unsubmitted members when deadline is at month start 00:00:00 UTC', async () => {
    const monthStartDeadline = new Date('2024-01-01T00:00:00Z');
    const thirtyMinutesBeforeDeadline = new Date('2023-12-31T23:30:00Z');
    const oneSecondBeforeMonthStart = new Date('2023-12-31T23:59:59Z');

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent', sentAt: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' })
    };

    // Member 1: submitted before the 30-minute threshold (23:00:00) - should be unsubmitted
    const memberWhoSubmittedEarly = {
      userId: 'user-001',
      userName: 'Alice Early',
      email: 'alice@example.com',
      lastSubmissionTime: new Date('2023-12-31T23:00:00Z')
    };

    // Member 2: submitted at exactly the 30-minute threshold (23:30:00) - should be submitted
    const memberWhoSubmittedAtThreshold = {
      userId: 'user-002',
      userName: 'Bob Threshold',
      email: 'bob@example.com',
      lastSubmissionTime: new Date('2023-12-31T23:30:00Z')
    };

    // Member 3: submitted after the 30-minute threshold (23:45:00) - should be submitted
    const memberWhoSubmittedAfterThreshold = {
      userId: 'user-003',
      userName: 'Carol Late',
      email: 'carol@example.com',
      lastSubmissionTime: new Date('2023-12-31T23:45:00Z')
    };

    // Member 4: submitted at month start deadline (00:00:00) - should be submitted
    const memberWhoSubmittedAtDeadline = {
      userId: 'user-004',
      userName: 'Dave Deadline',
      email: 'dave@example.com',
      lastSubmissionTime: new Date('2024-01-01T00:00:00Z')
    };

    // Member 5: never submitted (null timestamp) - should be unsubmitted
    const memberNeverSubmitted = {
      userId: 'user-005',
      userName: 'Eve Never',
      email: 'eve@example.com',
      lastSubmissionTime: null as unknown as Date
    };

    const mockTeamMembers = [
      memberWhoSubmittedEarly,
      memberWhoSubmittedAtThreshold,
      memberWhoSubmittedAfterThreshold,
      memberWhoSubmittedAtDeadline,
      memberNeverSubmitted
    ];

    Date.now = jest.fn(() => monthStartDeadline.getTime());

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-01',
      morningMeetingStartTime: '09:00',
      executorUserId: 'manager-001'
    };

    const result: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationAdapter as any,
      mockTeamMembers as any
    );

    expect(result.unsubmittedMembers).toHaveLength(2);

    const unsubmittedUserIds = result.unsubmittedMembers.map(m => m.userId).sort();
    expect(unsubmittedUserIds).toEqual(['user-001', 'user-005']);

    const aliceUnsubmitted = result.unsubmittedMembers.find(m => m.userId === 'user-001');
    expect(aliceUnsubmitted).toBeDefined();
    expect(aliceUnsubmitted!.userName).toBe('Alice Early');
    expect(aliceUnsubmitted!.email).toBe('alice@example.com');
    expect(aliceUnsubmitted!.remainingMinutes).toBeLessThan(0);

    const eveUnsubmitted = result.unsubmittedMembers.find(m => m.userId === 'user-005');
    expect(eveUnsubmitted).toBeDefined();
    expect(eveUnsubmitted!.userName).toBe('Eve Never');
    expect(eveUnsubmitted!.email).toBe('eve@example.com');

    expect(result.notificationsSent).toBe(2);

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);

    const callUserIds = mockNotificationAdapter.sendReminderNotification.mock.calls
      .map((call: any) => call[0]?.userId)
      .sort();
    expect(callUserIds).toEqual(['user-001', 'user-005']);

    expect(result.notificationFailures).toHaveLength(0);

    expect(result.executedAt).toBeDefined();
    const executedDate = new Date(result.executedAt);
    expect(executedDate.getTime()).toBe(monthStartDeadline.getTime());
  });
});