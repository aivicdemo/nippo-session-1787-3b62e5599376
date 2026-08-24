import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";
import { type DetectUnsubmittedMembersInput } from "../../src/logic/submission-status-tracking";

describe("未提出メンバー検出・通知機能", () => {
  // SCEN-2818
  test("朝会開始予定時刻がnullのとき、エラーが発生する", async () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      morningMeetingStartTime: null as unknown as string,
      executorUserId: "user-manager-001",
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    expect(() => {
      detectAndNotifyUnsubmittedMembers(input, mockNotificationServiceAdapter);
    }).toThrow(/朝会開始予定時刻/);
  });
});