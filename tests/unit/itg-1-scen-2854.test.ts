import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能 - ユーザーID欠落時のエラーハンドリング', () => {
  test('SCEN-2854: ユーザーIDが欠落しているメンバーへの通知送信が失敗する', async () => {
    // Arrange: NotificationServiceAdapterのモック化
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'failed' as const,
        sentAt: null,
        errorMessage: 'ユーザーID欠落',
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // テスト用の未提出メンバーデータ：ユーザーIDがnull
    const unsubmittedMembersWithMissingUserId = [
      {
        userId: null as unknown as string, // ユーザーID欠落
        userName: '田中太郎',
        email: 'tanaka@example.com',
        remainingMinutes: -30,
      },
    ];

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'exec-001',
    };

    // Act & Assert: ユーザーID欠落時の処理
    const result = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationAdapter,
      () => Promise.resolve(unsubmittedMembersWithMissingUserId)
    );

    // 検証1: 通知配信ログにエラーレコードが記録される
    expect(result.notificationFailures).toHaveLength(1);
    expect(result.notificationFailures[0]).toEqual({
      userId: null,
      failureReason: 'ユーザーID欠落',
    });

    // 検証2: 送信失敗件数が記録される
    expect(result.notificationsSent).toBe(0);

    // 検証3: エラーログが出力される（戻り値に含まれる情報から確認）
    expect(result.notificationFailures[0].failureReason).toMatch(/ユーザーID/);

    // 検証4: NotificationServiceAdapterが実行されていない、
    // または実行されてもエラーで中断していることを確認
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
      })
    );
  });
});