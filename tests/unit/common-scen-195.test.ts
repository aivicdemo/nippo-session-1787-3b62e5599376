import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("sendUnsubmittedReminder", () => {
  // SCEN-195: [normal] 日報収集・確認・催促の自動化エージェント AIエージェント
  test("should send unsubmitted reminder to 2 unsubmitted members out of 10 total members on daily morning execution", async () => {
    // Arrange: Setup fixed timestamp for today at 06:00 AM
    const executionTimestamp = new Date("2024-01-15T06:00:00Z");
    const today = "2024-01-15";

    // All 10 team members
    const allMemberIds = [
      "M001",
      "M002",
      "M003",
      "M004",
      "M005",
      "M006",
      "M007",
      "M008",
      "M009",
      "M010",
    ];
    const submittedMemberIds = ["M001", "M002", "M003", "M004", "M005", "M006"];
    const unsubmittedMemberIds = ["M007", "M008"];

    // Mock submission status response structure
    const submissionStatus = {
      date: today,
      totalMembers: 10,
      submittedCount: 8,
      unsubmittedCount: 2,
      submittedMemberIds: submittedMemberIds.concat(["M009", "M010"]),
      unsubmittedMemberIds: unsubmittedMemberIds,
      submittedReportIds: [
        "R001",
        "R002",
        "R003",
        "R004",
        "R005",
        "R006",
        "R007",
        "R008",
      ],
    };

    // Mock AI client that matches Tx11Imp1AiClient structure
    const mockAiClient = {
      submitCheckSubmissionStatus: jest.fn(async () => ({
        status: "success",
        data: submissionStatus,
      })),
      sendUnsubmittedNotifications: jest.fn(async () => ({
        status: "success",
        sentCount: 2,
        failedCount: 0,
      })),
      extractChallenges: jest.fn(async () => ({
        status: "success",
        data: { challenges: [] },
      })),
      assignPriorities: jest.fn(async () => ({
        status: "success",
        data: { prioritizedChallenges: [] },
      })),
      generateMorningBriefing: jest.fn(async () => ({
        status: "success",
        data: { briefingContent: "" },
      })),
      notifyManager: jest.fn(async () => ({
        status: "success",
        notificationSent: true,
      })),
      logAuditEvent: jest.fn(async () => ({
        status: "success",
        eventId: "AUD001",
      })),
    };

    // Act: Execute sendUnsubmittedReminder with mock AI client
    const result = await sendUnsubmittedReminder(
      {
        executionTime: executionTimestamp,
        targetDate: today,
        allMemberIds: allMemberIds,
        reminderDeadlineHour: 9,
      },
      mockAiClient
    );

    // Assert: Verify the reminder was sent to unsubmitted members
    expect(result.success).toBe(true);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(8);
    expect(result.unsubmittedCount).toBe(2);
    expect(result.unsubmittedMemberIds).toEqual(["M007", "M008"]);

    // Verify AI client was called with correct parameters
    expect(mockAiClient.submitCheckSubmissionStatus).toHaveBeenCalledWith({
      date: today,
      memberIds: allMemberIds,
      deadlineHour: 9,
    });

    // Verify notifications were sent to unsubmitted members
    expect(mockAiClient.sendUnsubmittedNotifications).toHaveBeenCalledWith({
      unsubmittedMemberIds: ["M007", "M008"],
      targetDate: today,
      reminderType: "morning",
    });

    // Verify audit log records the correct metrics
    expect(mockAiClient.logAuditEvent).toHaveBeenCalledWith({
      eventType: "UNSUBMITTED_REMINDER_SENT",
      timestamp: executionTimestamp.toISOString(),
      targetDate: today,
      totalMembersChecked: 10,
      submittedCount: 8,
      unsubmittedCount: 2,
      unsubmittedMemberIds: ["M007", "M008"],
      executionTime: "06:00:00",
    });

    // Verify sent notifications count matches
    expect(result.remindersAttempted).toBe(2);
    expect(result.remindersSent).toBe(2);
    expect(result.remindersFailed).toBe(0);
  });
});