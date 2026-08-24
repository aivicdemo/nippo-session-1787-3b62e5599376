import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード リアルタイム報告提出状況表示', () => {
  // SCEN-2842: [edge] 催促方法自動判定機能 - 手動トリガーでの実行時にはメール催促が催促方法として選定される
  test('手動トリガー実行時にメール催促が選定される', async () => {
    // テストデータ：催促履歴（Slack送信済み、メール未送信）
    const unsubmittedUserId = 'user_001';
    const teamId = 'team_001';
    const reportDate = '2024-01-15';
    const executorUserId = 'user_manager_001';

    // NotificationServiceAdapterのモック
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: unsubmittedUserId,
        status: 'sent',
        sentAt: new Date('2024-01-15T09:00:00Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        userId: unsubmittedUserId,
        channels: {
          slack: { status: 'sent', sentAt: new Date('2024-01-15T08:30:00Z') },
          email: { status: 'pending', sentAt: null },
          in_app: { status: 'pending', sentAt: null },
        },
      }),
    };

    // detectAndNotifyUnsubmittedMembers を手動トリガー（MANUAL）モードで実行
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime: '09:00',
        executorUserId,
      },
      mockNotificationAdapter,
      'MANUAL' // トリガーモード：手動
    );

    // アサーション 1: 関数が正常に返却される
    expect(result).toBeDefined();
    expect(result).toHaveProperty('unsubmittedMembers');
    expect(result).toHaveProperty('notificationsSent');
    expect(result).toHaveProperty('notificationFailures');
    expect(result).toHaveProperty('executedAt');

    // アサーション 2: NotificationServiceAdapterのsendReminderNotificationが
    // メール配信パラメータ（channel: 'email'）で呼び出されたことを確認
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
    
    // sendReminderNotificationの呼び出し引数を検証
    const callArgs = mockNotificationAdapter.sendReminderNotification.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs[0]).toEqual(
      expect.objectContaining({
        channel: 'email', // メール配信チャネルが指定されている
        userId: unsubmittedUserId,
      })
    );

    // アサーション 3: sendReminderNotificationが正確に1回呼び出されたことを確認
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);

    // アサーション 4: 結果に通知送信件数が記録されていることを確認
    // 手動トリガーで未提出メンバー1名に対してメール送信が実行される
    expect(result.notificationsSent).toBeGreaterThanOrEqual(1);

    // アサーション 5: executedAt が ISO 8601 形式の文字列であることを確認
    expect(typeof result.executedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.executedAt)).toBe(true);

    // アサーション 6: notificationFailures が配列であることを確認
    expect(Array.isArray(result.notificationFailures)).toBe(true);
  });
});