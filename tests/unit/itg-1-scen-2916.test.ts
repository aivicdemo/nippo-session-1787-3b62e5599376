import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking', () => {
  // SCEN-2916: [edge] 未提出メンバー抽出機能 - チームメンバーが同じ未提出ステータスで並ぶ場合全員が未提出判定される
  test('should extract all 5 unsubmitted members when all team members have unsubmitted status', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'executor-001';

    const unsubmittedMembers = [
      {
        userId: 'member-a',
        userName: 'MemberA',
        email: 'member-a@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'member-b',
        userName: 'MemberB',
        email: 'member-b@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'member-c',
        userName: 'MemberC',
        email: 'member-c@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'member-d',
        userName: 'MemberD',
        email: 'member-d@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'member-e',
        userName: 'MemberE',
        email: 'member-e@example.com',
        remainingMinutes: -30,
      },
    ];

    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({ sent: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      unsubmittedMembers,
      mockNotificationService
    );

    expect(result.unsubmittedMembers).toHaveLength(5);
    expect(result.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'member-a',
          userName: 'MemberA',
          email: 'member-a@example.com',
        }),
        expect.objectContaining({
          userId: 'member-b',
          userName: 'MemberB',
          email: 'member-b@example.com',
        }),
        expect.objectContaining({
          userId: 'member-c',
          userName: 'MemberC',
          email: 'member-c@example.com',
        }),
        expect.objectContaining({
          userId: 'member-d',
          userName: 'MemberD',
          email: 'member-d@example.com',
        }),
        expect.objectContaining({
          userId: 'member-e',
          userName: 'MemberE',
          email: 'member-e@example.com',
        }),
      ])
    );

    result.unsubmittedMembers.forEach((member) => {
      expect(['MemberA', 'MemberB', 'MemberC', 'MemberD', 'MemberE']).toContain(member.userName);
      expect(member.remainingMinutes).toBe(-30);
    });

    expect(result.notificationsSent).toBe(5);
    expect(result.notificationFailures).toHaveLength(0);
    expect(result.executedAt).toBeDefined();
  });
});