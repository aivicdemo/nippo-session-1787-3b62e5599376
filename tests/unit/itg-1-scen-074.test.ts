import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';

describe('朝会報告管理システム - リマインド通知サービス', () => {
  test('SCEN-074: 毎朝定時に登録済みチームメンバー全員へ報告入力のリマインド通知を自動送信し、報告期限までの残り時間を表示する', async () => {
    // テストデータの準備
    const teamId = 'team-001';
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineDateTime = new Date('2024-01-15T17:00:00Z');
    const notificationChannels = [
      { channelType: 'email', isEnabled: true },
      { channelType: 'in_app_notification', isEnabled: true }
    ];

    // モック関数の定義
    const mockBuildNotificationRecipientList = jest.fn().mockResolvedValue({
      recipients: [
        {
          userId: 'user-001',
          emailAddress: 'engineer1@company.com',
          displayName: 'Engineer 1',
          role: 'engineer'
        },
        {
          userId: 'user-002',
          emailAddress: 'engineer2@company.com',
          displayName: 'Engineer 2',
          role: 'engineer'
        },
        {
          userId: 'user-003',
          emailAddress: 'engineer3@company.com',
          displayName: 'Engineer 3',
          role: 'engineer'
        },
        {
          userId: 'user-004',
          emailAddress: 'engineer4@company.com',
          displayName: 'Engineer 4',
          role: 'engineer'
        },
        {
          userId: 'user-005',
          emailAddress: 'engineer5@company.com',
          displayName: 'Engineer 5',
          role: 'engineer'
        }
      ],
      totalCount: 5,
      excludedUserCount: 0
    });

    const mockFormatReminderNotificationContent = jest.fn().mockReturnValue({
      subject: '【朝会報告】本日の報告をお願いします',
      body: '朝会報告の入力をお願いします。残り8時間です。',
      remainingHours: 8,
      remainingMinutes: 0
    });

    const mockRecordNotificationSendingHistory = jest.fn()
      .mockResolvedValueOnce('history-001')
      .mockResolvedValueOnce('history-002')
      .mockResolvedValueOnce('history-003')
      .mockResolvedValueOnce('history-004')
      .mockResolvedValueOnce('history-005');

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn()
        .mockResolvedValueOnce({ status: 'success' })
        .mockResolvedValueOnce({ status: 'success' })
        .mockResolvedValueOnce({ status: 'success' })
        .mockResolvedValueOnce({ status: 'success' })
        .mockResolvedValueOnce({ status: 'success' })
    };

    // 関数の実行
    const result = await sendDailyReminderNotifications(
      {
        teamId,
        reportDeadlineDateTime,
        executionTimestamp,
        notificationChannels
      },
      {
        buildNotificationRecipientList: mockBuildNotificationRecipientList,
        formatReminderNotificationContent: mockFormatReminderNotificationContent,
        recordNotificationSendingHistory: mockRecordNotificationSendingHistory,
        notificationServiceAdapter: mockNotificationServiceAdapter
      }
    );

    // 期待結果の検証
    expect(result.successCount).toBe(5);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toEqual([
      'history-001',
      'history-002',
      'history-003',
      'history-004',
      'history-005'
    ]);
    expect(result.remainingTimeDisplay).toBe('残り8時間');

    // モック呼び出しの検証
    expect(mockBuildNotificationRecipientList).toHaveBeenCalledWith({
      targetUserIds: expect.any(Array),
      notificationType: 'daily_reminder',
      teamId
    });

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(5);

    expect(mockRecordNotificationSendingHistory).toHaveBeenCalledTimes(5);
  });
});