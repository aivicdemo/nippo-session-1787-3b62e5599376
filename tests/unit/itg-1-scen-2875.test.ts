import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput, NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知の段階的送信ロジック', () => {
  // SCEN-2875
  test('未提出メンバーリストに重複するメンバーIDが含まれる場合、重複を除外して通知が送信される', () => {
    const notificationCallLog: Array<{ userId: string; timestamp: Date }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: (userId: string, message: string): Promise<{ status: 'sent' | 'failed'; sentAt?: Date; errorMessage?: string }> => {
        notificationCallLog.push({ userId, timestamp: new Date() });
        return Promise.resolve({ status: 'sent', sentAt: new Date() });
      },
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'TEAM-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'EXEC-001',
    };

    const unsubmittedMembersWithDuplicates = [
      {
        userId: 'M001',
        userName: 'Member One',
        email: 'member1@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'M002',
        userName: 'Member Two',
        email: 'member2@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'M001',
        userName: 'Member One',
        email: 'member1@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'M003',
        userName: 'Member Three',
        email: 'member3@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'M002',
        userName: 'Member Two',
        email: 'member2@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'M004',
        userName: 'Member Four',
        email: 'member4@example.com',
        remainingMinutes: 45,
      },
    ];

    const result = detectAndNotifyUnsubmittedMembers(input, unsubmittedMembersWithDuplicates, mockNotificationServiceAdapter);

    expect(notificationCallLog.length).toBe(4);
    expect(notificationCallLog[0].userId).toBe('M001');
    expect(notificationCallLog[1].userId).toBe('M002');
    expect(notificationCallLog[2].userId).toBe('M003');
    expect(notificationCallLog[3].userId).toBe('M004');

    const uniqueUserIds = Array.from(new Set(notificationCallLog.map((log) => log.userId)));
    expect(uniqueUserIds).toEqual(['M001', 'M002', 'M003', 'M004']);
    expect(uniqueUserIds.length).toBe(4);

    expect(result.notificationsSent).toBe(4);
  });
});