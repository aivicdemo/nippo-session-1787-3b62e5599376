import { getNotificationDetail } from "../../src/logic/remind-notification-history";

describe("getNotificationDetail", () => {
  // SCEN-025
  test("should return notification detail with correct properties for valid notification ID", async () => {
    const input: GetNotificationDetailInput = {
      notificationId: "notify-001",
      userId: "user-456",
    };

    const result = await getNotificationDetail(input);

    expect(result).toEqual({
      notificationId: "notify-001",
      sentAt: "2024-01-15T09:00:00Z",
      recipients: [
        {
          memberId: "user-123",
          memberName: "John Doe",
          deliveryStatus: "delivered",
        },
      ],
      status: "sent",
      content: "朝会報告の提出リマインド",
      scheduleId: "schedule-001",
    });
  });
});