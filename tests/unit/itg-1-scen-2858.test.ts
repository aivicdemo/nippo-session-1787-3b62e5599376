import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput, type NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2858
  test('チームIDが欠落しているとき、チームメンバーの抽出に失敗する', async () => {
    // 入力パラメータ：チームID=null
    const input: DetectUnsubmittedMembersInput = {
      teamId: null as any,
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-001',
    };

    // NotificationServiceAdapterのスタブを準備
    const notificationServiceAdapterStub = {
      getTeamMembers: jest.fn().mockRejectedValue(
        new Error('チームID欠落'),
      ),
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // 催促処理を呼び出す
    let caughtError: Error | null = null;
    let result: DetectUnsubmittedMembersOutput | null = null;

    try {
      result = await detectAndNotifyUnsubmittedMembers(
        input,
        notificationServiceAdapterStub,
      );
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    // (1) エラーハンドラーが発動して処理が中断される
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/チームID欠落/);

    // (2) チームメンバー取得要求がチームID=nullで送信されたことを確認
    expect(notificationServiceAdapterStub.getTeamMembers).toHaveBeenCalledWith(
      null,
    );

    // (3) リマインド通知が一件も送信されない
    expect(
      notificationServiceAdapterStub.sendReminderNotification,
    ).not.toHaveBeenCalled();

    // (4) 結果は null のままで処理が中断されたことを確認
    expect(result).toBeNull();
  });
});