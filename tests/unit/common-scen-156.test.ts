import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  // SCEN-156
  test("should prevent duplicate report generation and notification when re-executing with same search conditions", async () => {
    // Setup: Mock data and state
    const searchConditions = {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      keywords: ["performance", "delay"],
    };

    const firstExecutionTimestamp = new Date("2024-01-15T09:00:00Z");
    const secondExecutionTimestamp = new Date("2024-01-15T09:05:00Z");

    const idempotencyKey = "tx8-exec-2024-01-01-to-2024-01-31-perf-delay";

    const mockUnsubmittedMembers = [
      {
        memberId: "user-001",
        memberName: "Alice",
        email: "alice@example.com",
        lastSubmissionDate: "2024-01-14T18:00:00Z",
        daysOverdue: 1,
      },
      {
        memberId: "user-002",
        memberName: "Bob",
        email: "bob@example.com",
        lastSubmissionDate: "2024-01-13T18:00:00Z",
        daysOverdue: 2,
      },
    ];

    const mockReportId = "report-tx8-20240115-abc123";
    const mockNotificationId = "notif-tx8-20240115-def456";

    // First execution: Call detectAndNotifyUnsubmitted
    const firstResult = await detectAndNotifyUnsubmitted({
      searchConditions,
      executionTimestamp: firstExecutionTimestamp,
      idempotencyKey,
      unsubmittedMembers: mockUnsubmittedMembers,
      reportGenerationEnabled: true,
      notificationEnabled: true,
      managerId: "manager-001",
      managerEmail: "manager@example.com",
    });

    expect(firstResult).toBeDefined();
    expect(firstResult.reportId).toBe(mockReportId);
    expect(firstResult.notificationId).toBe(mockNotificationId);
    expect(firstResult.unsubmittedCount).toBe(2);
    expect(firstResult.status).toBe("completed");
    expect(firstResult.idempotencyKey).toBe(idempotencyKey);

    // Record first execution state
    const firstReportId = firstResult.reportId;
    const firstNotificationId = firstResult.notificationId;
    const firstExecutionId = firstResult.executionId;

    // Verify first execution: Report and notification created
    expect(firstResult.reportSaved).toBe(true);
    expect(firstResult.notificationSent).toBe(true);
    expect(firstResult.auditLogCreated).toBe(true);

    // Second execution: Re-run with same conditions
    const secondResult = await detectAndNotifyUnsubmitted({
      searchConditions,
      executionTimestamp: secondExecutionTimestamp,
      idempotencyKey, // Same idempotency key
      unsubmittedMembers: mockUnsubmittedMembers,
      reportGenerationEnabled: true,
      notificationEnabled: true,
      managerId: "manager-001",
      managerEmail: "manager@example.com",
    });

    // Verify second execution: Idempotent behavior
    expect(secondResult).toBeDefined();
    expect(secondResult.status).toBe("skipped");
    expect(secondResult.reason).toBe("duplicate_execution");
    expect(secondResult.idempotencyKey).toBe(idempotencyKey);

    // Verify no duplicate writes
    expect(secondResult.reportId).toBe(firstReportId);
    expect(secondResult.reportSaved).toBe(false);
    expect(secondResult.notificationSent).toBe(false);
    expect(secondResult.duplicateDetected).toBe(true);

    // Verify audit trail
    expect(secondResult.auditLogCreated).toBe(true);
    expect(secondResult.auditLogEntry).toEqual({
      idempotencyKey,
      executionTimestamp: secondExecutionTimestamp.toISOString(),
      status: "skipped",
      reason: "duplicate_execution",
      previousExecutionId: firstExecutionId,
      unsubmittedCount: 2,
    });

    // Verify that notification was not duplicated
    expect(secondResult.notificationId).toBeNull();

    // Verify data consistency
    expect(secondResult.databaseStatistics).toEqual({
      reportRecordCount: 1,
      notificationRecordCount: 1,
      patternTableRecordCount: mockUnsubmittedMembers.length,
      bottleneckAnalysisRecordCount: expect.any(Number),
    });

    // Verify manager receives only one notification
    expect(firstResult.managerNotificationDelivered).toBe(true);
    expect(secondResult.managerNotificationDelivered).toBe(false);
  });
});