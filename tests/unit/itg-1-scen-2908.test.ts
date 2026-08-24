import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from "../../src/logic/submission-status-tracking";

describe("Daily Report Reminder Notification - Edge Case", () => {
  // SCEN-2908
  test("should send reminder notification when exactly 30 minutes before meeting start time plus subsecond margin", async () => {
    const meetingStartTime = new Date("2025-01-15T09:00:00Z");
    const scheduledTriggerTime = new Date("2025-01-15T08:30:00.5Z");
    const reportDeadlineTime = new Date("2025-01-15T09:00:00Z");

    const mockNotificationResults: Array<{
      userId: string;
      sentAt: Date;
      status: "sent" | "failed" | "skipped";
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(
        async (userId: string, message: string, channel: "email" | "in_app" | "slack") => {
          const sentAt = scheduledTriggerTime;
          mockNotificationResults.push({
            userId,
            sentAt,
            status: "sent",
          });
          return {
            userId,
            status: "sent" as const,
            sentAt,
            errorMessage: null,
          };
        }
      ),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduledTriggerTime,
      teamIds: ["team-001"],
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: ["email", "in_app", "slack"],
    };

    const mockTeamMembers = [
      {
        userId: "user-001",
        userName: "Engineer A",
        email: "engineer-a@example.com",
        teamId: "team-001",
      },
      {
        userId: "user-002",
        userName: "Engineer B",
        email: "engineer-b@example.com",
        teamId: "team-001",
      },
    ];

    const mockFetchTeamMembers = jest.fn(async () => mockTeamMembers);
    const mockCheckSubmissionStatus = jest.fn(
      async (userId: string, reportDate: string) => ({
        userId,
        hasSubmitted: false,
        submittedAt: null,
      })
    );

    const remainingMinutes = Math.floor(
      (reportDeadlineTime.getTime() - scheduledTriggerTime.getTime()) / 60000
    );

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      {
        sendReminderNotification: notificationServiceAdapterStub.sendReminderNotification,
        fetchTeamMembers: mockFetchTeamMembers,
        checkSubmissionStatus: mockCheckSubmissionStatus,
      }
    );

    expect(result.remainingTimeMinutes).toBe(remainingMinutes);
    expect(result.sentCount).toBeGreaterThanOrEqual(mockTeamMembers.length);
    expect(result.failedCount).toBe(0);

    const notificationDetails = result.notificationDetails;
    expect(notificationDetails).toBeDefined();
    expect(notificationDetails.length).toBeGreaterThanOrEqual(mockTeamMembers.length);

    const sentNotifications = notificationDetails.filter((nd) => nd.status === "sent");
    expect(sentNotifications.length).toBeGreaterThanOrEqual(mockTeamMembers.length);

    sentNotifications.forEach((notification) => {
      expect(notification.userId).toBeDefined();
      expect(notification.sentAt).toBeDefined();
      if (notification.sentAt) {
        const timeDiffMs = Math.abs(
          notification.sentAt.getTime() - scheduledTriggerTime.getTime()
        );
        expect(timeDiffMs).toBeLessThan(1000);
      }
      expect(notification.errorMessage).toBeNull();
    });

    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalled();

    expect(mockNotificationResults.length).toBeGreaterThanOrEqual(mockTeamMembers.length);
    mockNotificationResults.forEach((record) => {
      expect(record.sentAt.getTime()).toBeGreaterThanOrEqual(
        new Date("2025-01-15T08:30:00Z").getTime()
      );
      expect(record.sentAt.getTime()).toBeLessThanOrEqual(
        new Date("2025-01-15T08:30:01Z").getTime()
      );
      expect(record.status).toBe("sent");
    });
  });
});