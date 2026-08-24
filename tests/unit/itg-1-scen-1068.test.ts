import { describe, test, expect } from "@jest/globals";
import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";

describe("毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能", () => {
  // SCEN-1068
  test("ユーザーIDが空文字列のとき、ValidationErrorがスローされてログが記録されない", async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      scheduledTime: new Date("2024-01-15T08:30:00Z"),
      teamIds: ["team-001"],
      reportDeadlineTime: new Date("2024-01-15T09:00:00Z"),
      notificationChannels: ["email", "in_app", "slack"] as const,
      userIds: [""],
    };

    expect(() =>
      sendDailyReportReminder(input, mockNotificationServiceAdapter)
    ).toThrow(/ユーザーID/);
  });
});