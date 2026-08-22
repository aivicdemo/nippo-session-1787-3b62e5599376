import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";
import { type ReminderPayload } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-072: sends reminders to unsubmitted members with correct payload", async () => {
    const unsubmittedMembers = [
      {
        member_id: "M001",
        member_name: "Alice",
        email: "alice@example.com",
        team_id: "T001",
        unsubmitted_hours: 2,
      },
      {
        member_id: "M002",
        member_name: "Bob",
        email: "bob@example.com",
        team_id: "T001",
        unsubmitted_hours: 4,
      },
    ];

    const payload: ReminderPayload = {
      recipients: unsubmittedMembers,
      deadline_at: new Date("2024-01-15T11:00:00Z"),
      reminder_type: "pre_deadline",
      reminder_sequence: 1,
    };

    const mockNotificationService = {
      send: jest.fn().mockResolvedValue({
        success: true,
        sent_count: 2,
        failed_count: 0,
      }),
    };

    const result = await sendUnsubmittedReminder(
      payload,
      mockNotificationService
    );

    expect(result.success).toBe(true);
    expect(result.sent_count).toBe(2);
    expect(result.failed_count).toBe(0);
    expect(mockNotificationService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: expect.arrayContaining([
          expect.objectContaining({
            member_id: "M001",
            email: "alice@example.com",
          }),
          expect.objectContaining({
            member_id: "M002",
            email: "bob@example.com",
          }),
        ]),
        deadline_at: new Date("2024-01-15T11:00:00Z"),
        reminder_type: "pre_deadline",
        reminder_sequence: 1,
      })
    );
  });
});