import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking', () => {
  test('SCEN-2878: 期限超過1分以上経過した提出済みメンバーは催促対象から除外される', async () => {
    // Setup: モック化されたNotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'sent' as const,
        sentAt: new Date(),
        errorMessage: null,
      }),
    };

    // Setup: テスト用の日報提出状況データベース
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const currentTimeAfterDeadline = new Date('2024-01-15T09:01:00Z');

    // Setup: チームメンバーデータ
    const teamId = 'team-001';
    const reportDate = '2024-01-15';

    // Setup: 提出済みメンバーA, C, E, G, I (5名)
    const submittedMembers = [
      {
        userId: 'user-A',
        userName: 'Member A',
        email: 'memberA@example.com',
        submittedAt: new Date('2024-01-15T08:50:00Z'),
      },
      {
        userId: 'user-C',
        userName: 'Member C',
        email: 'memberC@example.com',
        submittedAt: new Date('2024-01-15T08:55:00Z'),
      },
      {
        userId: 'user-E',
        userName: 'Member E',
        email: 'memberE@example.com',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
      },
      {
        userId: 'user-G',
        userName: 'Member G',
        email: 'memberG@example.com',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        userId: 'user-I',
        userName: 'Member I',
        email: 'memberI@example.com',
        submittedAt: new Date('2024-01-15T08:40:00Z'),
      },
    ];

    // Setup: 未提出メンバーB, D, F, H, J (5名)
    const unsubmittedMembers = [
      {
        userId: 'user-B',
        userName: 'Member B',
        email: 'memberB@example.com',
      },
      {
        userId: 'user-D',
        userName: 'Member D',
        email: 'memberD@example.com',
      },
      {
        userId: 'user-F',
        userName: 'Member F',
        email: 'memberF@example.com',
      },
      {
        userId: 'user-H',
        userName: 'Member H',
        email: 'memberH@example.com',
      },
      {
        userId: 'user-J',
        userName: 'Member J',
        email: 'memberJ@example.com',
      },
    ];

    // Execute: 未提出メンバー催促通知ロジックを実行
    // 現在時刻は09:01 (期限09:00から1分超過)
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId: teamId,
        reportDate: reportDate,
        morningMeetingStartTime: '09:00',
        executorUserId: 'executor-001',
      },
      mockNotificationAdapter,
      {
        submittedMembers: submittedMembers,
        unsubmittedMembers: unsubmittedMembers,
        deadlineTime: reportDeadlineTime,
        currentTime: currentTimeAfterDeadline,
      }
    );

    // Verify: 未提出メンバーB, D, F, H, Jのみに通知が送信される
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(5);

    // Verify: 通知対象が未提出メンバーのみであることを確認
    const calledUserIds = mockNotificationAdapter.sendReminderNotification.mock.calls.map(
      (call) => call[0].userId
    );
    expect(calledUserIds).toEqual(
      expect.arrayContaining(['user-B', 'user-D', 'user-F', 'user-H', 'user-J'])
    );
    expect(calledUserIds).not.toContain('user-A');
    expect(calledUserIds).not.toContain('user-C');
    expect(calledUserIds).not.toContain('user-E');
    expect(calledUserIds).not.toContain('user-G');
    expect(calledUserIds).not.toContain('user-I');

    // Verify: 結果の検証
    expect(result.unsubmittedMembers).toHaveLength(5);
    expect(result.notificationsSent).toBe(5);
    expect(result.notificationFailures).toHaveLength(0);
    expect(result.executedAt).toBeDefined();
  });
});