import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";
import { type NotificationServiceAdapter } from "../../src/adapters/notification-service-adapter";

describe("detectAndNotifyUnsubmittedMembers", () => {
  // SCEN-2873
  test("should not execute reminder notification logic when current time is 15 minutes 1 second before morning meeting start time", async () => {
    // Arrange: Set morning meeting start time to 09:00:00
    const morningMeetingStartTime = "09:00";
    
    // Set current time to 08:44:59 (15 minutes 1 second before 09:00:00)
    const currentTime = new Date("2024-01-15T08:44:59Z");
    const baseDate = "2024-01-15";
    
    // Create stub for NotificationServiceAdapter to track calls
    const notificationServiceAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        sentAt: new Date(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "pending",
      }),
    };

    // Mock the current time
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => currentTime.getTime());

    try {
      // Act: Execute the reminder notification detection logic
      const result = await detectAndNotifyUnsubmittedMembers(
        {
          teamId: "team-001",
          reportDate: baseDate,
          morningMeetingStartTime: morningMeetingStartTime,
          executorUserId: "user-001",
        },
        notificationServiceAdapter
      );

      // Assert: Verify that sendReminderNotification and scheduleNotification were never called
      expect(notificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
      expect(notificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
      
      // Verify that the result indicates no notifications were sent
      expect(result.notificationsSent).toBe(0);
    } finally {
      // Restore original Date.now
      Date.now = originalDateNow;
    }
  });
});