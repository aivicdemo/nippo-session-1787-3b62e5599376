import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-166
  test("should send unsubmitted reminder notifications to members who have not submitted reports by deadline", async () => {
    const targetDate = new Date("2024-01-15T09:00:00Z");
    const deadline = new Date("2024-01-15T08:30:00Z");
    const memberIds = ["member_001", "member_002", "member_003"];
    const submittedMembers = ["member_001"];
    const unsubmittedMembers = ["member_002", "member_003"];
    const companyDomain = "company.com";

    const mockNotificationService = {
      send: jest.fn().mockResolvedValue({
        success: true,
        notificationId: "notif_12345",
        timestamp: targetDate.toISOString(),
      }),
    };

    const mockReportDataService = {
      getSubmittedMembers: jest
        .fn()
        .mockResolvedValue(submittedMembers),
      getAllMembers: jest.fn().mockResolvedValue(memberIds),
    };

    const mockAuditLogger = {
      log: jest.fn().mockResolvedValue({
        success: true,
        eventId: "audit_001",
      }),
    };

    const result = await sendUnsubmittedReminder(
      {
        targetDate,
        deadline,
        memberIds,
        companyDomain,
      },
      {
        notificationService: mockNotificationService,
        reportDataService: mockReportDataService,
        auditLogger: mockAuditLogger,
      }
    );

    expect(result).toEqual({
      success: true,
      unsubmittedCount: 2,
      submittedCount: 1,
      notificationsSent: 2,
      timestamp: expect.any(String),
    });

    expect(mockReportDataService.getSubmittedMembers).toHaveBeenCalledWith({
      targetDate: targetDate.toISOString().split("T")[0],
    });

    expect(mockNotificationService.send).toHaveBeenCalledTimes(2);

    const firstCall = mockNotificationService.send.mock.calls[0][0];
    expect(firstCall.memberId).toBe("member_002");
    expect(firstCall.type).toBe("unsubmitted_reminder");
    expect(firstCall.recipientEmail).toMatch(
      /member_002@company\.com/
    );

    const secondCall = mockNotificationService.send.mock.calls[1][0];
    expect(secondCall.memberId).toBe("member_003");
    expect(secondCall.type).toBe("unsubmitted_reminder");
    expect(secondCall.recipientEmail).toMatch(
      /member_003@company\.com/
    );

    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "unsubmitted_reminder_sent",
        unsubmittedCount: 2,
      })
    );
  });
});