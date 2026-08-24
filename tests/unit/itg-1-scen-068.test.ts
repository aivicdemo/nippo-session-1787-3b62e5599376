import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-068: [error] 日報送信期限判定機能 - 朝会開始時刻が null のとき処理が進まずエラーを返す
  test('朝会開始時刻が null のとき INVALID_MORNING_TIME エラーを返し NotificationServiceAdapter を呼び出さない', () => {
    const input = {
      reportId: 'report-001',
      userId: 'user-001',
      submissionTimestamp: new Date('2024-01-15T08:45:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'Completed task A',
        todayPlan: 'Plan task B',
        challenges: 'Issue with resource X',
      },
      morningMeetingStartTime: null as any,
    };

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        deliveryId: 'deliv-001',
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    expect(() =>
      submitDailyReport(input, notificationServiceAdapterStub)
    ).toThrow(/朝会開始時刻/);

    expect(
      notificationServiceAdapterStub.sendReminderNotification
    ).not.toHaveBeenCalled();
  });
});