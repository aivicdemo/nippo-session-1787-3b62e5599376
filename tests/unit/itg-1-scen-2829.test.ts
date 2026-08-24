import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking: detectAndNotifyUnsubmittedMembers', () => {
  // SCEN-2829
  test('returns error when team members count and submission status count mismatch', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-manager-001';

    const teamMembers = [
      { userId: 'user-a', userName: 'Member A', email: 'a@example.com' },
      { userId: 'user-b', userName: 'Member B', email: 'b@example.com' },
      { userId: 'user-c', userName: 'Member C', email: 'c@example.com' },
      { userId: 'user-d', userName: 'Member D', email: 'd@example.com' },
      { userId: 'user-e', userName: 'Member E', email: 'e@example.com' },
    ];

    const submissionStatuses = [
      { userId: 'user-a', submitted: true, submittedAt: new Date('2024-01-15T08:30:00Z') },
      { userId: 'user-b', submitted: true, submittedAt: new Date('2024-01-15T08:45:00Z') },
      { userId: 'user-c', submitted: true, submittedAt: new Date('2024-01-15T08:50:00Z') },
    ];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
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
      teamMembers,
      submissionStatuses,
      mockNotificationAdapter
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toBeTruthy();
    expect(result.error?.message).toMatch(/チームメンバーリスト.*提出状況データの件数が不一致/);
    expect(result.error?.message).toContain('5');
    expect(result.error?.message).toContain('3');
    expect(result.unsubmittedMembers).toBeUndefined();
    expect(result.notificationsSent).toBeUndefined();
    expect(result.notificationFailures).toBeUndefined();
  });
});