import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput, NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('detectAndNotifyUnsubmittedMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2880
  test('should detect unsubmitted members and send reminders on month-start morning meeting time', async () => {
    const mockNow = new Date('2024-04-01T08:55:00+09:00');
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'sent' as const,
        sentAt: mockNow,
        errorMessage: null,
      }),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-04-01',
      morningMeetingStartTime: '09:00',
      executorUserId: 'exec-user-001',
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationAdapter as any
    );

    expect(result).toBeDefined();
    expect(result.executedAt).toBeTruthy();

    const resultDate = new Date(result.executedAt);
    expect(resultDate.getFullYear()).toBe(2024);
    expect(resultDate.getMonth()).toBe(3);
    expect(resultDate.getDate()).toBe(1);

    expect(typeof result.notificationsSent).toBe('number');
    expect(result.notificationsSent).toBeGreaterThanOrEqual(0);

    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(Array.isArray(result.notificationFailures)).toBe(true);

    const totalExpectedNotifications = result.unsubmittedMembers.length;
    const successfulNotifications = result.notificationsSent;
    const failedNotifications = result.notificationFailures.length;

    expect(successfulNotifications + failedNotifications).toBe(
      totalExpectedNotifications
    );

    result.unsubmittedMembers.forEach((member) => {
      expect(member.userId).toBeTruthy();
      expect(typeof member.userId).toBe('string');
      expect(member.userName).toBeTruthy();
      expect(typeof member.userName).toBe('string');
      expect(member.email).toBeTruthy();
      expect(typeof member.email).toBe('string');
      expect(typeof member.remainingMinutes).toBe('number');
    });

    result.notificationFailures.forEach((failure: NotificationFailure) => {
      expect(failure.userId).toBeTruthy();
      expect(typeof failure.userId).toBe('string');
      expect(failure.failureReason).toBeTruthy();
      expect(typeof failure.failureReason).toBe('string');
    });

    jest.useRealTimers();
  });
});