import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-2857
  test('現在時刻がnullのとき、朝会開始予定時刻の15分前判定が失敗する', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-dept-head';

    // モック用のスタブ
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // 現在時刻がnullを返すモック
    const getCurrentTimeStub = jest.fn().mockReturnValue(null);

    // 現在時刻がnullの場合、15分前判定処理でエラーが発生することを確認
    expect(() => {
      detectAndNotifyUnsubmittedMembers(
        {
          teamId,
          reportDate,
          morningMeetingStartTime,
          executorUserId,
        },
        notificationServiceAdapterStub,
        getCurrentTimeStub
      );
    }).toThrow(/現在時刻|null|時刻の取得/);

    // NotificationServiceAdapterのsendReminderNotificationメソッドが呼び出されていないことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
  });
});