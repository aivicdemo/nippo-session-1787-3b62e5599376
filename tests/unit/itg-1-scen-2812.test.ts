import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('未提出メンバー判定機能 - べき等性検証', () => {
  test('SCEN-2812: 同じ未提出メンバーリストを複数回実行しても同一の結果が返される', async () => {
    // Arrange: NotificationServiceAdapterモック化
    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'sent',
        sentAt: new Date(),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        userId: '',
        status: 'sent',
        sentAt: new Date(),
      }),
    };

    // Arrange: テスト入力データ定義
    const baseInput = {
      teamId: 'team-001',
      reportDate: '2026-08-20',
      morningMeetingStartTime: '09:00',
      executorUserId: 'executor-user-001',
    };

    // Arrange: 未提出メンバーのシミュレーション
    // member001, member003, member007が未提出状態
    // member002, member004, member005, member006, member008, member009, member010は提出済みと想定

    // Act: 第1回目実行
    const result1 = await detectAndNotifyUnsubmittedMembers(
      baseInput,
      mockNotificationAdapter
    );

    // Act: 第2回目実行（同じ条件、システム状態は変更なし）
    const result2 = await detectAndNotifyUnsubmittedMembers(
      baseInput,
      mockNotificationAdapter
    );

    // Act: 第3回目実行（同じ条件、システム状態は変更なし）
    const result3 = await detectAndNotifyUnsubmittedMembers(
      baseInput,
      mockNotificationAdapter
    );

    // Assert: 未提出メンバーリストの件数が3件で統一されているか検証
    expect(result1.unsubmittedMembers.length).toBe(3);
    expect(result2.unsubmittedMembers.length).toBe(3);
    expect(result3.unsubmittedMembers.length).toBe(3);

    // Assert: 未提出メンバーIDが同じ順序で返されているか検証
    const memberIds1 = result1.unsubmittedMembers.map((m) => m.userId);
    const memberIds2 = result2.unsubmittedMembers.map((m) => m.userId);
    const memberIds3 = result3.unsubmittedMembers.map((m) => m.userId);

    expect(memberIds1).toEqual(['member001', 'member003', 'member007']);
    expect(memberIds2).toEqual(['member001', 'member003', 'member007']);
    expect(memberIds3).toEqual(['member001', 'member003', 'member007']);

    // Assert: 完全に同一のリストが返されるか検証
    expect(result1.unsubmittedMembers).toEqual(result2.unsubmittedMembers);
    expect(result2.unsubmittedMembers).toEqual(result3.unsubmittedMembers);
    expect(result1.unsubmittedMembers).toEqual(result3.unsubmittedMembers);

    // Assert: 通知送信件数の一貫性を検証
    expect(result1.notificationsSent).toBe(result2.notificationsSent);
    expect(result2.notificationsSent).toBe(result3.notificationsSent);

    // Assert: 通知失敗件数の一貫性を検証
    expect(result1.notificationFailures.length).toBe(
      result2.notificationFailures.length
    );
    expect(result2.notificationFailures.length).toBe(
      result3.notificationFailures.length
    );

    // Assert: 外部APIが呼び出されたかどうか検証（モック状態の確認）
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});