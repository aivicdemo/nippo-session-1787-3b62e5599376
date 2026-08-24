import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-305: [edge] リマインド通知自動送信機能 - チームメンバーリストに同じユーザーIDが重複して含まれる場合、重複を排除して1回だけ通知が送信される
  test('チームメンバーリストに重複ユーザーIDが含まれる場合、重複を排除して各ユーザーに1回だけ通知を送信する', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email', 'slack'];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn()
        .mockResolvedValueOnce({ userId: 'user-001', status: 'sent' as const, sentAt: new Date('2024-01-15T09:05:00Z'), errorMessage: null })
        .mockResolvedValueOnce({ userId: 'user-002', status: 'sent' as const, sentAt: new Date('2024-01-15T09:05:00Z'), errorMessage: null })
        .mockResolvedValueOnce({ userId: 'user-003', status: 'sent' as const, sentAt: new Date('2024-01-15T09:05:00Z'), errorMessage: null }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels,
    };

    const mockTeamMembersData = {
      'team-001': [
        { userId: 'user-001', userName: 'Alice', email: 'alice@example.com' },
        { userId: 'user-002', userName: 'Bob', email: 'bob@example.com' },
        { userId: 'user-001', userName: 'Alice', email: 'alice@example.com' },
        { userId: 'user-003', userName: 'Charlie', email: 'charlie@example.com' },
        { userId: 'user-001', userName: 'Alice', email: 'alice@example.com' },
      ],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mockNotificationServiceAdapter, mockTeamMembersData);

    expect(result.sentCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(60);
    expect(result.notificationDetails).toHaveLength(3);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);

    const uniqueUserIds = new Set<string>();
    result.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).not.toBeNull();
      expect(detail.errorMessage).toBeNull();
      uniqueUserIds.add(detail.userId);
    });

    expect(uniqueUserIds.size).toBe(3);
    expect(Array.from(uniqueUserIds).sort()).toEqual(['user-001', 'user-002', 'user-003']);

    const callArguments = mockNotificationServiceAdapter.sendReminderNotification.mock.calls;
    const calledUserIds = callArguments.map((call: any[]) => call[0]?.userId);
    const uniqueCalledUserIds = new Set(calledUserIds);
    expect(uniqueCalledUserIds.size).toBe(3);
  });
});