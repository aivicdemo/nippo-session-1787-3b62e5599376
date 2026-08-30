import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - リマインド通知サービス', () => {
  // SCEN-311
  test('毎朝定時に登録済みチームメンバー全員へ報告入力のリマインド通知を自動送信し、メールアドレスまたは通知チャネル未設定のメンバーは送信失敗として記録', async () => {
    const mockBuildNotificationRecipientList = jest.fn().mockResolvedValue({
      recipients: [
        {
          userId: 'member1',
          emailAddress: 'user1@example.com',
          displayName: 'Member One',
          role: 'engineer',
        },
        {
          userId: 'member2',
          emailAddress: null,
          displayName: 'Member Two',
          role: 'engineer',
        },
        {
          userId: 'member3',
          emailAddress: 'user3@example.com',
          displayName: 'Member Three',
          role: 'engineer',
        },
        {
          userId: 'member4',
          emailAddress: 'user4@example.com',
          displayName: 'Member Four',
          role: 'engineer',
        },
      ],
      totalCount: 4,
      excludedUserCount: 0,
    });

    const mockFormatReminderNotificationContent = jest
      .fn()
      .mockReturnValue({
        subject: 'リマインド: 本日の朝会報告をお願いします',
        body: 'Member One様\n本日の朝会報告をまだ提出されていません。\n報告期限まで残り30分です。\nチーム: 本体\n\nお手数ですが、早めのご提出をお願いいたします。',
        remainingTimeDisplay: '残り30分',
        urgencyLevel: 'HIGH',
      });

    const mockRecordNotificationSendingHistory = jest
      .fn()
      .mockImplementation((record) => {
        if (record.userId === 'member1') return 'hist-1';
        if (record.userId === 'member2') return 'hist-2';
        if (record.userId === 'member3') return 'hist-3';
        if (record.userId === 'member4') return 'hist-4';
        return '';
      });

    const mockSendNotification = jest
      .fn()
      .mockImplementation((email, body) => {
        if (!email) {
          throw new Error('メールアドレスが無効です');
        }
        return Promise.resolve({ success: true });
      });

    const teamId = 'team-001';
    const reportDeadlineDateTime = new Date('2025-01-15T09:00:00Z');
    const executionTimestamp = new Date('2025-01-15T08:30:00Z');
    const notificationChannels = [
      { channelType: 'email', isEnabled: true },
      { channelType: 'slack', isEnabled: true },
    ];

    const result = await sendDailyReminderNotifications(
      {
        teamId,
        reportDeadlineDateTime,
        executionTimestamp,
        notificationChannels,
      },
      {
        buildNotificationRecipientList: mockBuildNotificationRecipientList,
        formatReminderNotificationContent: mockFormatReminderNotificationContent,
        recordNotificationSendingHistory: mockRecordNotificationSendingHistory,
        sendNotification: mockSendNotification,
      }
    );

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(2);
    expect(result.notificationHistoryIds).toEqual([
      'hist-1',
      'hist-2',
      'hist-3',
      'hist-4',
    ]);
    expect(result.remainingTimeDisplay).toBe('残り30分');
  });
});