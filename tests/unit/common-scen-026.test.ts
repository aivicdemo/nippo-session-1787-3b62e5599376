import { getNotificationDetail } from "../../src/logic/remind-notification-history";

describe("remind-notification-history", () => {
  // SCEN-026
  test("should return error when notification is not found", async () => {
    const input = {
      notificationId: "non-existent-id-12345",
      userId: "user-001",
    };

    try {
      await getNotificationDetail(input);
      fail("Expected getNotificationDetail to throw an error");
    } catch (error: unknown) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.message).toMatch(/リマインド通知が見つかりません/);
      }
      // Verify error structure if it's an object with status/code
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "code" in error
      ) {
        const errorObj = error as Record<string, unknown>;
        expect(errorObj.status).toBe(404);
        expect([
          "NOT_FOUND",
          "REMINDER_NOT_FOUND",
        ]).toContain(errorObj.code);
      }
    }
  });
});