import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知の段階的送信ロジック', () => {
  test('SCEN-2872: 朝会開始予定時刻の14分59秒前では催促通知の判定が実行されない', async () => {
    // システムの現在時刻を固定: 朝会開始予定時刻の14分59秒前
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const currentTimeAt14m59sBefore = new Date(
      morningMeetingStartTime.getTime() - 14 * 60 * 1000 - 59 * 1000
    );

    // NotificationServiceAdapterのスタブ化
    const sendReminderNotificationSpy = jest.fn().mockResolvedValue({
      sentCount: 0,
      failedCount: 0,
      notificationDetails: [],
    });

    const notificationServiceAdapterStub = {
      sendReminderNotification: sendReminderNotificationSpy,
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({}),
    };

    // 通知配信ログを記録するモック
    const notificationLogRecords: Array<{
      userId: string;
      timestamp: Date;
      status: string;
    }> = [];

    // 現在時刻を14分59秒前に設定してテスト実行
    const mockCurrentTime = currentTimeAt14m59sBefore;

    // 入力パラメータ
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: morningMeetingStartTime.toISOString().split('T')[1].substring(0, 5), // "09:00"
      executorUserId: 'user-manager-001',
      currentTime: mockCurrentTime,
      notificationServiceAdapter: notificationServiceAdapterStub,
    };

    // 14分59秒前の時点で催促通知判定ロジックを実行
    const resultAt14m59sBefore = await detectAndNotifyUnsubmittedMembers(input);

    // 14分59秒前では通知が送信されないことを確認
    expect(sendReminderNotificationSpy).not.toHaveBeenCalled();
    expect(notificationLogRecords.length).toBe(0);

    // システムの時刻を朝会開始予定時刻の14分0秒前に進める
    const currentTimeAt14m0sBefore = new Date(
      morningMeetingStartTime.getTime() - 14 * 60 * 1000
    );

    // sendReminderNotificationをリセット
    sendReminderNotificationSpy.mockClear();

    // 催促通知判定ロジックを再度実行（14分0秒前）
    const inputAt14m0sBefore = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: morningMeetingStartTime.toISOString().split('T')[1].substring(0, 5), // "09:00"
      executorUserId: 'user-manager-001',
      currentTime: currentTimeAt14m0sBefore,
      notificationServiceAdapter: notificationServiceAdapterStub,
    };

    const resultAt14m0sBefore = await detectAndNotifyUnsubmittedMembers(inputAt14m0sBefore);

    // 14分0秒前で初めて通知が送信されることを確認
    expect(sendReminderNotificationSpy).toHaveBeenCalled();

    // 通知の内容を検証
    const callArgs = sendReminderNotificationSpy.mock.calls[0];
    expect(callArgs).toBeDefined();

    // 残り時間が約14分（840秒）であることを確認
    const expectedRemainingMinutes = 14;
    expect(resultAt14m0sBefore).toBeDefined();
    expect(resultAt14m0sBefore.remainingTimeMinutes).toBe(expectedRemainingMinutes);
  });
});