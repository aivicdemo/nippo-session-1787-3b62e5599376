import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能 - 段階的切り替えロジック', () => {
  // SCEN-2859
  test('再催促ルール設定がnullのとき、段階的な通知方法の切り替えが実行されない', async () => {
    // Arrange: NotificationServiceAdapterをスタブ化
    const sendReminderNotificationCalls: Array<{ userId: string; channels: string[] }> = [];
    const notificationLogRecords: Array<{ userId: string; channelType: string; sentAt: Date }> = [];

    const stubNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, channels: string[]) => {
        sendReminderNotificationCalls.push({ userId, channels });
        notificationLogRecords.push({
          userId,
          channelType: channels[0],
          sentAt: new Date('2024-01-15T08:30:00Z'),
        });
        return { sentAt: new Date('2024-01-15T08:30:00Z'), status: 'sent' as const };
      }),
      getDeliveryStatus: jest.fn(async () => ({ delivered: 1, failed: 0 })),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
    };

    // 未提出メンバー1人のテストデータ
    const unsubmittedMembers = [
      {
        userId: 'USER001',
        userName: '山田太郎',
        email: 'yamada.taro@example.com',
        remainingMinutes: -15, // 15分期限超過
      },
    ];

    const testInput: DetectUnsubmittedMembersInput = {
      teamId: 'TEAM001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'EXEC001',
      notificationAdapter: stubNotificationAdapter,
      retryRuleConfig: null, // ★ 再催促ルール設定がnull
    };

    // Act
    const result: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(testInput);

    // Assert: NotificationServiceAdapterへの呼び出し回数が1回のみ
    expect(sendReminderNotificationCalls.length).toBe(1);
    expect(sendReminderNotificationCalls[0].userId).toBe('USER001');

    // Assert: デフォルト単一チャネル（Slack）による1回の催促通知のみが送信される
    expect(sendReminderNotificationCalls[0].channels).toEqual(['slack']);

    // Assert: 通知配信ログに1件のみ記録される
    expect(notificationLogRecords.length).toBe(1);
    expect(notificationLogRecords[0].userId).toBe('USER001');
    expect(notificationLogRecords[0].channelType).toBe('slack');

    // Assert: 段階的な通知方法の切り替えが実行されていない（複数チャネルへの振り替わりがない）
    const uniqueChannels = new Set(
      notificationLogRecords
        .filter((rec) => rec.userId === 'USER001')
        .map((rec) => rec.channelType)
    );
    expect(uniqueChannels.size).toBe(1);
    expect(Array.from(uniqueChannels)[0]).toBe('slack');

    // Assert: 返却結果の検証
    expect(result.unsubmittedMembers.length).toBe(1);
    expect(result.notificationsSent).toBe(1);
    expect(result.notificationFailures.length).toBe(0);
    expect(result.executedAt).toBeDefined();
  });
});