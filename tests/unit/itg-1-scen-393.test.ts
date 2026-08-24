import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-393
  test('チームメンバーリストが降順のとき、全メンバーへの通知配信が完了する', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    // テスト用の逆順メンバーリスト（ユーザーID降順）
    const descendingMembers = [
      { userId: 'user-010', email: 'user10@example.com', notificationPreference: 'email' },
      { userId: 'user-009', email: 'user9@example.com', notificationPreference: 'email' },
      { userId: 'user-008', email: 'user8@example.com', notificationPreference: 'email' },
      { userId: 'user-007', email: 'user7@example.com', notificationPreference: 'email' },
      { userId: 'user-006', email: 'user6@example.com', notificationPreference: 'email' },
      { userId: 'user-005', email: 'user5@example.com', notificationPreference: 'email' },
      { userId: 'user-004', email: 'user4@example.com', notificationPreference: 'email' },
      { userId: 'user-003', email: 'user3@example.com', notificationPreference: 'email' },
      { userId: 'user-002', email: 'user2@example.com', notificationPreference: 'email' },
      { userId: 'user-001', email: 'user1@example.com', notificationPreference: 'email' },
    ];

    const notificationCallHistory: Array<{ userId: string; timestamp: Date }> = [];
    const successStatuses: ReminderNotificationDetail[] = [];

    // NotificationServiceAdapterをスタブ化
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (userId: string, _channels: string[]) => {
        notificationCallHistory.push({
          userId,
          timestamp: new Date(),
        });
        return {
          status: 'sent' as const,
          sentAt: new Date(),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(async () => ({})),
      getDeliveryStatus: jest.fn(async () => ({ delivered: true })),
    };

    // 入力データ構築
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // 実行時に降順メンバーをモック返却
    const mockDatabaseGetTeamMembers = jest.fn(async (_teamId: string) => descendingMembers);

    // 関数実行
    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      notificationServiceAdapterStub,
      mockDatabaseGetTeamMembers
    );

    // 期待値: 10名全員に通知が送信され、全員が配信成功
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(10);
    
    // 各メンバーへの通知が1回ずつ呼び出されたことを確認
    expect(notificationCallHistory).toHaveLength(10);
    
    // 降順のメンバーIDがすべて含まれていることを確認
    const sentUserIds = notificationCallHistory.map(call => call.userId).sort();
    const expectedUserIds = [
      'user-001', 'user-002', 'user-003', 'user-004', 'user-005',
      'user-006', 'user-007', 'user-008', 'user-009', 'user-010',
    ];
    expect(sentUserIds).toEqual(expectedUserIds);

    // 出力値の検証
    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);
    expect(result.notificationDetails).toHaveLength(10);

    // 全員の配信ステータスが'sent'であることを確認
    result.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).not.toBeNull();
      expect(detail.errorMessage).toBeNull();
    });

    // 期限までの残り時間が正しく計算されていることを確認
    const expectedRemainingMinutes = Math.floor(
      (reportDeadlineTime.getTime() - scheduledTime.getTime()) / (1000 * 60)
    );
    expect(result.remainingTimeMinutes).toBe(expectedRemainingMinutes);
  });
});