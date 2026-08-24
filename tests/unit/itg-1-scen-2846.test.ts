import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput, type NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2846: [normal] 朝会開始予定時刻の15分前トリガーで催促通知が送信される
  test('should send reminder notifications to unsubmitted members 15 minutes before morning meeting start time', async () => {
    // Arrange: テスト入力を準備
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'admin-user-001';

    // Stub用のモック関数：通知送信を記録
    const sentNotifications: Array<{
      userId: string;
      message: string;
      sentAt: Date;
    }> = [];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        sentNotifications.push({
          userId,
          message,
          sentAt: new Date('2024-01-15T08:45:00Z'),
        });
        return { status: 'sent', sentAt: new Date('2024-01-15T08:45:00Z') };
      }),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    // Act: 未提出メンバー催促通知処理を実行
    // 注: 実装では現在時刻を08:45に模擬し、朝会開始時刻09:00との差分を15分と算出
    const output: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationAdapter,
      new Date('2024-01-15T08:45:00Z'), // 現在時刻を08:45に固定
    );

    // Assert: 通知が3名の未提出メンバーに送信されたことを確認
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);

    // Assert: 各呼び出しのメッセージに「15分」の文字列が含まれることを確認
    mockNotificationAdapter.sendReminderNotification.mock.calls.forEach((call) => {
      const [, message] = call;
      expect(message).toMatch(/15分/);
    });

    // Assert: 通知配信ログに3件のレコードが記録されたことを確認
    expect(output.notificationsSent).toBe(3);
    expect(output.executedAt).toBe('2024-01-15T08:45:00Z');

    // Assert: 通知配信ログの詳細を検証
    expect(sentNotifications).toHaveLength(3);
    sentNotifications.forEach((notification) => {
      expect(notification.sentAt).toEqual(new Date('2024-01-15T08:45:00Z'));
    });

    // Assert: 通知送信テーブルのレコード内容（ユーザーID、タイムスタンプ、ステータス）を確認
    const notificationRecords = sentNotifications.map((n) => ({
      userId: n.userId,
      timestamp: n.sentAt.toISOString(),
      status: 'sent' as const,
    }));

    expect(notificationRecords).toEqual([
      {
        userId: expect.any(String),
        timestamp: '2024-01-15T08:45:00Z',
        status: 'sent',
      },
      {
        userId: expect.any(String),
        timestamp: '2024-01-15T08:45:00Z',
        status: 'sent',
      },
      {
        userId: expect.any(String),
        timestamp: '2024-01-15T08:45:00Z',
        status: 'sent',
      },
    ]);

    // Assert: 失敗した通知がないことを確認
    expect(output.notificationFailures).toHaveLength(0);
  });
});