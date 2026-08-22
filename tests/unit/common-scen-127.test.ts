import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-127: sendUnsubmittedReminder sends reminder notifications to unsubmitted members", async () => {
    const mockMembers = [
      {
        memberId: "member-001",
        name: "Alice",
        email: "alice@example.com",
        submitted: false,
      },
      {
        memberId: "member-002",
        name: "Bob",
        email: "bob@example.com",
        submitted: false,
      },
      {
        memberId: "member-003",
        name: "Charlie",
        email: "charlie@example.com",
        submitted: true,
      },
    ];

    const mockSendEmail = jest.fn().mockResolvedValue({ success: true });

    const result = await sendUnsubmittedReminder(mockMembers, mockSendEmail);

    expect(result).toEqual({
      totalMembers: 3,
      unsubmittedCount: 2,
      remindersSent: 2,
      notificationIds: expect.arrayContaining([
        expect.stringMatching(/^notif-/),
        expect.stringMatching(/^notif-/),
      ]),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
    });

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject: expect.stringContaining("reminder"),
      })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "bob@example.com",
        subject: expect.stringContaining("reminder"),
      })
    );
  });
});