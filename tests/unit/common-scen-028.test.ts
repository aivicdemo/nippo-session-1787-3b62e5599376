import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-028: sendUnsubmittedReminder sends reminder to unsubmitted members", async () => {
    const unsubmittedMembers = [
      {
        memberId: "user-001",
        memberName: "Taro Yamada",
        email: "taro@example.com",
        teamId: "team-001",
      },
      {
        memberId: "user-002",
        memberName: "Hanako Suzuki",
        email: "hanako@example.com",
        teamId: "team-001",
      },
    ];

    const reminderConfig = {
      recipientCount: 2,
      scheduledTime: "2024-01-15T09:00:00Z",
      messageTemplate: "Please submit your daily report by 09:30",
      retryLimit: 3,
    };

    const mockMailSendResult = {
      sentAt: "2024-01-15T09:00:05Z",
      successCount: 2,
      failureCount: 0,
      messageIds: ["msg-001", "msg-002"],
    };

    const result = await sendUnsubmittedReminder(
      unsubmittedMembers,
      reminderConfig
    );

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(result.messageIds).toHaveLength(2);
    expect(result.messageIds).toContain("msg-001");
    expect(result.messageIds).toContain("msg-002");
    expect(result.sentAt).toBe("2024-01-15T09:00:05Z");
  });
});