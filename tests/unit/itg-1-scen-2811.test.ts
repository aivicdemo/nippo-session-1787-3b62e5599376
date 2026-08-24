import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバーリストの優先度ソート機能', () => {
  // SCEN-2811
  test('未提出メンバーが優先度順に昇順でソートされて返される', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-admin-001';

    const unsubmittedMembers = [
      {
        userId: 'user-member-a',
        userName: 'Member A',
        email: 'member-a@example.com',
        remainingMinutes: 45,
        priority: 3,
      },
      {
        userId: 'user-member-b',
        userName: 'Member B',
        email: 'member-b@example.com',
        remainingMinutes: 45,
        priority: 1,
      },
      {
        userId: 'user-member-c',
        userName: 'Member C',
        email: 'member-c@example.com',
        remainingMinutes: 45,
        priority: 2,
      },
      {
        userId: 'user-member-d',
        userName: 'Member D',
        email: 'member-d@example.com',
        remainingMinutes: 45,
        priority: 5,
      },
      {
        userId: 'user-member-e',
        userName: 'Member E',
        email: 'member-e@example.com',
        remainingMinutes: 45,
        priority: 4,
      },
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ success: true, deliveryStatus: 'sent' }),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ success: true, scheduledId: 'sched-001' }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ deliveryStatus: 'sent' }),
    };

    const input = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
      unsubmittedMembers,
      notificationServiceAdapter: mockNotificationServiceAdapter,
    };

    const result = await detectAndNotifyUnsubmittedMembers(input);

    expect(result.unsubmittedMembers).toHaveLength(5);
    expect(result.unsubmittedMembers[0].userId).toBe('user-member-b');
    expect(result.unsubmittedMembers[0].priority).toBe(1);
    expect(result.unsubmittedMembers[1].userId).toBe('user-member-c');
    expect(result.unsubmittedMembers[1].priority).toBe(2);
    expect(result.unsubmittedMembers[2].userId).toBe('user-member-a');
    expect(result.unsubmittedMembers[2].priority).toBe(3);
    expect(result.unsubmittedMembers[3].userId).toBe('user-member-e');
    expect(result.unsubmittedMembers[3].priority).toBe(4);
    expect(result.unsubmittedMembers[4].userId).toBe('user-member-d');
    expect(result.unsubmittedMembers[4].priority).toBe(5);

    expect(result.notificationsSent).toBe(5);
    expect(result.notificationFailures).toHaveLength(0);
  });
});