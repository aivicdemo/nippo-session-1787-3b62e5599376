import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";
import type {
  DetectUnsubmittedMembersInput,
  DetectUnsubmittedMembersOutput,
  NotificationFailure,
} from "../../src/logic/submission-status-tracking";

describe("未提出メンバー催促通知機能", () => {
  // SCEN-2864
  test("通知送信ステータスが不正値のとき、再催促ルール判定が失敗する", () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "INVALID_STATUS",
        sentAt: new Date("2024-01-15T09:00:00Z"),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      morningMeetingStartTime: "09:00",
      executorUserId: "user-admin-001",
    };

    expect(() =>
      detectAndNotifyUnsubmittedMembers(
        input,
        mockNotificationServiceAdapter
      )
    ).toThrow(/通知ステータスが不正です/);
  });
});