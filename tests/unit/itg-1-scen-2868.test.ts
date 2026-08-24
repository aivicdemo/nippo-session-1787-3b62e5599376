import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知の段階的送信ロジック', () => {
  // SCEN-2868
  test('未提出メンバーが正確に1名の場合、その1名に対してのみ催促通知が送信される', async () => {
    const now = new Date('2024-01-15T08:00:00Z');
    const deadlineTime = new Date('2024-01-15T08:30:00Z');
    const teamId = 'team-001';
    const requestUserId = 'director-001';
    
    const submittedMemberIds = [
      'member-001',
      'member-002',
      'member-003',
      'member-004',
      'member-005',
      'member-006',
      'member-007',
      'member-008',
      'member-009',
    ];
    
    const unsubmittedMemberId = 'member-010';
    
    const unsubmittedMemberInfo = {
      userId: unsubmittedMemberId,
      userName: 'Test Member J',
      email: 'member.j@example.com',
      remainingMinutes: 30,
    };
    
    const notificationLog: Array<{
      userId: string;
      status: string;
      sentAt?: Date | null;
      errorMessage?: string | null;
    }> = [];
    
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        notificationLog.push({
          userId,
          status: 'sent',
          sentAt: now,
          errorMessage: null,
        });
        return { success: true, userId, sentAt: now };
      }),
      getDeliveryStatus: jest.fn(),
      scheduleNotification: jest.fn(),
    };
    
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate: '2024-01-15',
        morningMeetingStartTime: '09:00',
        executorUserId: requestUserId,
      },
      mockNotificationServiceAdapter,
      [unsubmittedMemberInfo],
      deadlineTime
    );
    
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(unsubmittedMemberId);
    
    expect(notificationLog).toHaveLength(1);
    expect(notificationLog[0]).toEqual({
      userId: unsubmittedMemberId,
      status: 'sent',
      sentAt: now,
      errorMessage: null,
    });
    
    expect(result.notificationsSent).toBe(1);
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe(unsubmittedMemberId);
  });
});