import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - 重複メンバーへの通知送信', () => {
  test('SCEN-2575: 送信対象メンバーリストに重複が含まれる場合、重複メンバーに複数回通知が送信される', async () => {
    // Arrange: モック化されたNotificationServiceAdapter
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user_A',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
        errorMessage: null,
      }),
    };

    // 送信対象メンバーリストに重複を含める（user_Aが2回出現）
    const duplicateTeamIds = ['team_001', 'team_001'];
    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: duplicateTeamIds,
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app'],
    };

    // 重複メンバーの詳細情報（同じユーザーID user_A が2回含まれる）
    const duplicateMembers = [
      {
        userId: 'user_A',
        userName: 'Alice',
        email: 'alice@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user_A', // 重複
        userName: 'Alice',
        email: 'alice@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user_B',
        userName: 'Bob',
        email: 'bob@example.com',
        remainingMinutes: 30,
      },
    ];

    // Act: リマインド通知自動送信処理を実行
    const output = await sendDailyReportReminder(
      input,
      notificationServiceAdapter as any
    );

    // Assert: user_A に対して2回呼び出されたことを検証
    const user_A_calls = notificationServiceAdapter.sendReminderNotification.mock.calls.filter(
      (call) => call[0]?.userId === 'user_A'
    );
    expect(user_A_calls.length).toBe(2);

    // Assert: 通知配信ログに user_A の記録が2件存在することを検証
    const user_A_details = output.notificationDetails.filter(
      (detail) => detail.userId === 'user_A'
    );
    expect(user_A_details.length).toBe(2);

    // Assert: 両方とも 'sent' ステータスであることを確認
    user_A_details.forEach((detail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeDefined();
      expect(detail.errorMessage).toBeNull();
    });

    // Assert: user_B は1回だけ呼び出されたことを検証
    const user_B_calls = notificationServiceAdapter.sendReminderNotification.mock.calls.filter(
      (call) => call[0]?.userId === 'user_B'
    );
    expect(user_B_calls.length).toBe(1);

    // Assert: 出力の sentCount は重複を含めた総送信回数（3回）であることを検証
    expect(output.sentCount).toBe(3);
    expect(output.failedCount).toBe(0);

    // Assert: remainingTimeMinutes が正しく計算されていることを検証（30分）
    expect(output.remainingTimeMinutes).toBe(30);
  });
});