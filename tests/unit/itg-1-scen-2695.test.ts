import { fetchYesterdayReport } from "../../src/logic/report-submission";

describe("朝会報告管理システム - 前日報告内容取得機能", () => {
  // SCEN-2695: [error] 前日報告内容取得機能 - ユーザーがシステムに登録されていないとき、エラーが発生する
  test("ユーザーが登録されていない場合、認証エラーが返される", async () => {
    const unregisteredEngineerId = "unregistered-engineer-999";
    const targetDate = new Date("2024-01-15");
    const requestingUserId = "requesting-user-001";

    const input = {
      engineerId: unregisteredEngineerId,
      targetDate,
      requestingUserId,
    };

    const stubNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    expect(() =>
      fetchYesterdayReport(
        input,
        stubNotificationServiceAdapter as any
      )
    ).toThrow(/ユーザー/);

    expect(
      stubNotificationServiceAdapter.sendReminderNotification
    ).not.toHaveBeenCalled();
    expect(
      stubNotificationServiceAdapter.scheduleNotification
    ).not.toHaveBeenCalled();
    expect(
      stubNotificationServiceAdapter.getDeliveryStatus
    ).not.toHaveBeenCalled();
  });
});