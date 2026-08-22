import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  sendUnsubmittedReminder,
  type NotificationDeliveryClient,
} from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  let mockNotificationClient: NotificationDeliveryClient;
  let auditLog: Array<{
    timestamp: string;
    event: string;
    details: Record<string, unknown>;
  }>;

  beforeEach(() => {
    auditLog = [];

    mockNotificationClient = {
      fetchUnsubmittedMembers: jest.fn(async () => [
        {
          memberId: "M-001",
          memberName: "Engineer A",
          teamId: "T-001",
          expectedSubmissionTime: new Date("2024-01-15T08:00:00Z"),
        },
        {
          memberId: "M-002",
          memberName: "Engineer B",
          teamId: "T-001",
          expectedSubmissionTime: new Date("2024-01-15T08:00:00Z"),
        },
      ]),

      sendReminderNotification: jest.fn(async (payload) => {
        auditLog.push({
          timestamp: new Date("2024-01-15T09:30:00Z").toISOString(),
          event: "REMINDER_SENT",
          details: {
            memberId: payload.memberId,
            memberName: payload.memberName,
            teamId: payload.teamId,
          },
        });
        return {
          notificationId: `NOTIF-${payload.memberId}-001`,
          sentAt: new Date("2024-01-15T09:30:00Z").toISOString(),
          status: "SENT",
        };
      }),

      recordReminderHistory: jest.fn(async (payload) => {
        auditLog.push({
          timestamp: new Date("2024-01-15T09:30:01Z").toISOString(),
          event: "REMINDER_HISTORY_RECORDED",
          details: {
            memberId: payload.memberId,
            notificationId: payload.notificationId,
            reminderCount: payload.reminderCount,
          },
        });
        return {
          historyId: `HIST-${payload.memberId}-001`,
          recordedAt: new Date("2024-01-15T09:30:01Z").toISOString(),
        };
      }),

      notifyManager: jest.fn(async (payload) => {
        auditLog.push({
          timestamp: new Date("2024-01-15T09:30:02Z").toISOString(),
          event: "MANAGER_NOTIFICATION_SENT",
          details: {
            managerId: payload.managerId,
            unsubmittedCount: payload.unsubmittedCount,
            teamId: payload.teamId,
          },
        });
        return {
          notificationId: `NOTIF-MGR-${payload.managerId}-001`,
          sentAt: new Date("2024-01-15T09:30:02Z").toISOString(),
          status: "SENT",
        };
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-095
  test("should execute sendUnsubmittedReminder and record audit trail for unsubmitted report notifications", async () => {
    const teamId = "T-001";
    const managerId = "MGR-001";
    const executionTime = new Date("2024-01-15T09:30:00Z");

    const result = await sendUnsubmittedReminder(
      {
        teamId,
        managerId,
        executionTime,
        reminderThresholdMinutes: 30,
      },
      mockNotificationClient
    );

    expect(mockNotificationClient.fetchUnsubmittedMembers).toHaveBeenCalledWith({
      teamId,
      thresholdTime: new Date("2024-01-15T09:00:00Z"),
    });

    expect(mockNotificationClient.sendReminderNotification).toHaveBeenCalledTimes(
      2
    );
    expect(mockNotificationClient.sendReminderNotification).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        memberId: "M-001",
        memberName: "Engineer A",
        teamId: "T-001",
        sentAt: executionTime.toISOString(),
      })
    );
    expect(mockNotificationClient.sendReminderNotification).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        memberId: "M-002",
        memberName: "Engineer B",
        teamId: "T-001",
        sentAt: executionTime.toISOString(),
      })
    );

    expect(mockNotificationClient.recordReminderHistory).toHaveBeenCalledTimes(
      2
    );
    expect(mockNotificationClient.recordReminderHistory).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        memberId: "M-001",
        notificationId: "NOTIF-M-001-001",
        reminderCount: 1,
      })
    );
    expect(mockNotificationClient.recordReminderHistory).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        memberId: "M-002",
        notificationId: "NOTIF-M-002-001",
        reminderCount: 1,
      })
    );

    expect(mockNotificationClient.notifyManager).toHaveBeenCalledWith({
      managerId,
      teamId,
      unsubmittedCount: 2,
      unsubmittedMembers: [
        { memberId: "M-001", memberName: "Engineer A" },
        { memberId: "M-002", memberName: "Engineer B" },
      ],
      notificationTime: executionTime.toISOString(),
    });

    expect(auditLog.length).toBe(5);
    expect(auditLog[0]).toEqual({
      timestamp: "2024-01-15T09:30:00Z",
      event: "REMINDER_SENT",
      details: expect.objectContaining({
        memberId: "M-001",
        memberName: "Engineer A",
        teamId: "T-001",
      }),
    });
    expect(auditLog[1]).toEqual({
      timestamp: "2024-01-15T09:30:01Z",
      event: "REMINDER_HISTORY_RECORDED",
      details: expect.objectContaining({
        memberId: "M-001",
      }),
    });
    expect(auditLog[2]).toEqual({
      timestamp: "2024-01-15T09:30:00Z",
      event: "REMINDER_SENT",
      details: expect.objectContaining({
        memberId: "M-002",
        memberName: "Engineer B",
        teamId: "T-001",
      }),
    });
    expect(auditLog[3]).toEqual({
      timestamp: "2024-01-15T09:30:01Z",
      event: "REMINDER_HISTORY_RECORDED",
      details: expect.objectContaining({
        memberId: "M-002",
      }),
    });
    expect(auditLog[4]).toEqual({
      timestamp: "2024-01-15T09:30:02Z",
      event: "MANAGER_NOTIFICATION_SENT",
      details: expect.objectContaining({
        managerId: "MGR-001",
        unsubmittedCount: 2,
        teamId: "T-001",
      }),
    });

    expect(result).toEqual({
      status: "SUCCESS",
      teamId: "T-001",
      unsubmittedCount: 2,
      notificationsSent: 2,
      remindersRecorded: 2,
      managerNotificationSent: true,
      executionTime: "2024-01-15T09:30:00Z",
      auditLogEntries: 5,
    });
  });
});