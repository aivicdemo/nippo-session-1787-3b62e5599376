import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
} from "../../src/logic/submission-status-tracking";

describe("sendDailyReportReminder - スケジュール登録時刻 null エラー処理", () => {
  // SCEN-1074
  test("スケジュール登録時刻が null のとき、定時配信スケジュール登録でエラーになる", async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        sentAt: new Date("2024-01-15T09:30:00Z"),
        status: "sent" as const,
      }),
      scheduleNotification: jest
        .fn()
        .mockRejectedValueOnce(
          new Error("スケジュール登録時刻が指定されていません")
        ),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: "pending" }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: null as unknown as Date,
      teamIds: ["team-001", "team-002"],
      reportDeadlineTime: new Date("2024-01-15T10:00:00Z"),
      notificationChannels: ["email", "in_app", "slack"],
    };

    await expect(
      sendDailyReportReminder(input, mockNotificationServiceAdapter)
    ).rejects.toThrow(/スケジュール登録時刻/);

    expect(mockNotificationServiceAdapter.scheduleNotification).toHaveBeenCalled();
    const callArgs = mockNotificationServiceAdapter.scheduleNotification.mock
      .calls[0];
    expect(callArgs[0].scheduledTime).toBeNull();
  });
});