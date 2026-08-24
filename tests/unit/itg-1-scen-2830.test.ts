import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput, type NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('Unsubmitted Member Detection and Priority Ordering', () => {
  // SCEN-2830
  it('should return unsubmitted members in priority order 30 minutes before deadline', async () => {
    // Fixed deadline: 09:00
    const deadlineTimeStr = '09:00';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-manager-001';

    // Current time: exactly 30 minutes before deadline (08:30)
    const currentTime = new Date('2024-01-15T08:30:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(currentTime);

    // Mock NotificationServiceAdapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: currentTime,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 0,
        failed: 0,
      }),
    };

    // Prepare test data: 10 team members
    // Member A: unsubmitted, oldest registration (previous day 09:00)
    // Member B: unsubmitted, newer registration (previous day 10:00)
    // Members C-J: already submitted

    const unsubmittedMembers = [
      {
        userId: 'user-member-a',
        userName: 'Member A',
        email: 'member.a@example.com',
        registrationTime: new Date('2024-01-14T09:00:00Z'),
        submitted: false,
      },
      {
        userId: 'user-member-b',
        userName: 'Member B',
        email: 'member.b@example.com',
        registrationTime: new Date('2024-01-14T10:00:00Z'),
        submitted: false,
      },
    ];

    const submittedMembers = Array.from({ length: 8 }, (_, i) => ({
      userId: `user-member-${String.fromCharCode(67 + i)}`,
      userName: `Member ${String.fromCharCode(67 + i)}`,
      email: `member.${String.fromCharCode(99 + i)}@example.com`,
      registrationTime: new Date('2024-01-14T08:00:00Z'),
      submitted: true,
    }));

    // Create detection input
    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    // Mock database or data source to return the prepared members
    // (In real implementation, this would be injected or mocked at the repository level)
    const mockGetUnsubmittedMembers = jest.fn().mockResolvedValue(unsubmittedMembers);
    const mockGetAllTeamMembers = jest.fn().mockResolvedValue([...unsubmittedMembers, ...submittedMembers]);

    // Execute function with mocked dependencies
    // (In actual implementation, dependencies would be injected)
    const result: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter,
    );

    // Assertions: verify unsubmitted members are returned in priority order
    expect(result.unsubmittedMembers).toHaveLength(2);

    // Member A should be first (oldest registration)
    expect(result.unsubmittedMembers[0].userId).toBe('user-member-a');
    expect(result.unsubmittedMembers[0].userName).toBe('Member A');
    expect(result.unsubmittedMembers[0].email).toBe('member.a@example.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(30);

    // Member B should be second (newer registration)
    expect(result.unsubmittedMembers[1].userId).toBe('user-member-b');
    expect(result.unsubmittedMembers[1].userName).toBe('Member B');
    expect(result.unsubmittedMembers[1].email).toBe('member.b@example.com');
    expect(result.unsubmittedMembers[1].remainingMinutes).toBe(30);

    // Verify notification was sent for each unsubmitted member
    expect(result.notificationsSent).toBe(2);

    // Verify notification failures is empty
    expect(result.notificationFailures).toHaveLength(0);

    // Verify execution timestamp is recorded
    expect(result.executedAt).toBeDefined();
    const executedAtDate = new Date(result.executedAt);
    expect(executedAtDate.toISOString()).toBe('2024-01-15T08:30:00.000Z');

    // Verify sendReminderNotification was called exactly twice
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});