import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking: detectAndNotifyUnsubmittedMembers', () => {
  // SCEN-2813: [normal] 朝会開始予定時刻30分前トリガー判定機能 - 朝会開始予定時刻の30分前に未提出確認が自動実行される
  test('should detect unsubmitted members and send notifications 30 minutes before morning meeting start time', async () => {
    // Setup: Mock the current time to be 31 minutes before the meeting start time
    const morningMeetingStartTime = '09:00';
    const currentTime = new Date('2024-01-15T08:29:00Z');
    const frozenTime = currentTime.getTime();
    
    jest.useFakeTimers();
    jest.setSystemTime(frozenTime);

    // Prepare test data: unsubmitted members (3+) and submitted members
    const unsubmittedMember1 = {
      userId: 'user-001',
      userName: 'Alice Johnson',
      email: 'alice@example.com',
      remainingMinutes: 31
    };

    const unsubmittedMember2 = {
      userId: 'user-002',
      userName: 'Bob Smith',
      email: 'bob@example.com',
      remainingMinutes: 31
    };

    const unsubmittedMember3 = {
      userId: 'user-003',
      userName: 'Carol Davis',
      email: 'carol@example.com',
      remainingMinutes: 31
    };

    const submittedMember1 = {
      userId: 'user-004',
      userName: 'Diana Wilson',
      email: 'diana@example.com',
      remainingMinutes: 31
    };

    const submittedMember2 = {
      userId: 'user-005',
      userName: 'Eve Martinez',
      email: 'eve@example.com',
      remainingMinutes: 31
    };

    // Mock NotificationServiceAdapter
    const sentNotifications: { userId: string; sentAt: Date }[] = [];
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        sentNotifications.push({
          userId,
          sentAt: new Date(frozenTime)
        });
        return { status: 'sent' as const, sentAt: new Date(frozenTime) };
      })
    };

    // Prepare input for the function
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: morningMeetingStartTime,
      executorUserId: 'executor-001'
    };

    // Mock database to return the unsubmitted and submitted members
    const mockDatabaseAdapter = {
      getUnsubmittedMembers: jest.fn(async () => [
        unsubmittedMember1,
        unsubmittedMember2,
        unsubmittedMember3
      ]),
      getSubmittedMembers: jest.fn(async () => [
        submittedMember1,
        submittedMember2
      ]),
      recordNotificationLog: jest.fn(async (logEntry: {
        userId: string;
        sentAt: Date;
        status: string;
      }) => {
        return { recorded: true };
      })
    };

    // Execute the function with mocked adapters
    const output: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationAdapter,
      mockDatabaseAdapter
    );

    // Verify the output contains correct unsubmitted members
    expect(output.unsubmittedMembers).toHaveLength(3);
    expect(output.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'user-001' }),
        expect.objectContaining({ userId: 'user-002' }),
        expect.objectContaining({ userId: 'user-003' })
      ])
    );

    // Verify notifications were sent only to unsubmitted members
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'user-001',
      expect.any(String)
    );
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'user-002',
      expect.any(String)
    );
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      'user-003',
      expect.any(String)
    );

    // Verify that no notifications were sent to submitted members
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalledWith(
      'user-004',
      expect.any(String)
    );
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalledWith(
      'user-005',
      expect.any(String)
    );

    // Verify the sent notifications have the correct user IDs
    expect(sentNotifications).toHaveLength(3);
    const sentUserIds = sentNotifications.map(n => n.userId).sort();
    expect(sentUserIds).toEqual(['user-001', 'user-002', 'user-003']);

    // Verify notification logs were recorded with correct execution time
    expect(mockDatabaseAdapter.recordNotificationLog).toHaveBeenCalledTimes(3);
    expect(mockDatabaseAdapter.recordNotificationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
        sentAt: new Date(frozenTime),
        status: 'sent'
      })
    );
    expect(mockDatabaseAdapter.recordNotificationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-002',
        sentAt: new Date(frozenTime),
        status: 'sent'
      })
    );
    expect(mockDatabaseAdapter.recordNotificationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-003',
        sentAt: new Date(frozenTime),
        status: 'sent'
      })
    );

    // Verify the output contains the correct notification statistics
    expect(output.notificationsSent).toBe(3);
    expect(output.notificationFailures).toHaveLength(0);
    expect(output.executedAt).toBeDefined();

    jest.useRealTimers();
  });
});