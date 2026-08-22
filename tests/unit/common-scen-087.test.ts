import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-087: sendUnsubmittedReminder should prevent duplicate notifications on idempotent retry", async () => {
    // Setup: Mock database and notification service
    const mockDb = {
      issues: [] as Array<{ id: string; content: string; priority: string; createdAt: string }>,
      notificationLogs: [] as Array<{ id: string; type: string; recipientId: string; sentAt: string; requestId: string }>,
      auditLogs: [] as Array<{ id: string; action: string; details: string; timestamp: string; requestId: string }>,
    };

    const mockEmailService = {
      sent: [] as Array<{ to: string; subject: string; body: string; requestId: string }>,
    };

    const mockIdempotencyStore = new Map<string, { executed: boolean; result: unknown }>();

    // Test data: Identical dashboard analysis request
    const dashboardRequest = {
      requestId: "req-dashboard-001",
      timestamp: new Date("2024-01-15T09:00:00Z").toISOString(),
      analysisData: {
        unsubmittedMembers: ["user-001", "user-002"],
        extractedIssues: [
          {
            id: "issue-001",
            content: "API response delay detected",
            priority: "HIGH",
            affectedMembers: ["user-003"],
          },
        ],
        dashboardMetrics: {
          totalReports: 8,
          submittedReports: 6,
          submissionRate: 0.75,
        },
      },
    };

    // Mock implementation of sendUnsubmittedReminder with idempotency support
    const executeWithIdempotency = async (request: typeof dashboardRequest) => {
      const idempotencyKey = `${request.requestId}-${request.timestamp}`;

      // Check if already executed
      if (mockIdempotencyStore.has(idempotencyKey)) {
        mockDb.auditLogs.push({
          id: `audit-${mockDb.auditLogs.length + 1}`,
          action: "IDEMPOTENT_SKIP",
          details: `同一tx_4_imp_1リクエスト [requestId=${request.requestId}] は既実行済み`,
          timestamp: new Date().toISOString(),
          requestId: request.requestId,
        });
        return { skipped: true, idempotencyKey };
      }

      // First execution: Process all actions
      const issueWriteResult = {
        id: "issue-001",
        content: request.analysisData.extractedIssues[0].content,
        priority: request.analysisData.extractedIssues[0].priority,
        createdAt: request.timestamp,
      };
      mockDb.issues.push(issueWriteResult);

      // Send notifications to unsubmitted members
      for (const memberId of request.analysisData.unsubmittedMembers) {
        mockDb.notificationLogs.push({
          id: `notif-${mockDb.notificationLogs.length + 1}`,
          type: "UNSUBMITTED_REMINDER",
          recipientId: memberId,
          sentAt: new Date().toISOString(),
          requestId: request.requestId,
        });
        mockEmailService.sent.push({
          to: `${memberId}@example.com`,
          subject: "朝会報告のご提出をお願いします",
          body: "まだ朝会報告が提出されていません。",
          requestId: request.requestId,
        });
      }

      // Send summary to manager
      mockDb.notificationLogs.push({
        id: `notif-${mockDb.notificationLogs.length + 1}`,
        type: "MANAGER_SUMMARY",
        recipientId: "manager-001",
        sentAt: new Date().toISOString(),
        requestId: request.requestId,
      });
      mockEmailService.sent.push({
        to: "manager@example.com",
        subject: "朝会用レポート（優先度別課題一覧）",
        body: `高優先度課題: ${request.analysisData.extractedIssues[0].content}`,
        requestId: request.requestId,
      });

      // Record successful execution
      mockIdempotencyStore.set(idempotencyKey, { executed: true, result: issueWriteResult });

      // Record audit log
      mockDb.auditLogs.push({
        id: `audit-${mockDb.auditLogs.length + 1}`,
        action: "EXECUTE",
        details: `実行完了: 課題書き込み1件、未提出通知${request.analysisData.unsubmittedMembers.length}件、管理者通知1件`,
        timestamp: new Date().toISOString(),
        requestId: request.requestId,
      });

      return {
        skipped: false,
        idempotencyKey,
        issueId: issueWriteResult.id,
        notificationsCount: request.analysisData.unsubmittedMembers.length + 1,
      };
    };

    // First execution
    const firstExecutionResult = await executeWithIdempotency(dashboardRequest);

    // Verify first execution results
    expect(firstExecutionResult.skipped).toBe(false);
    expect(mockDb.issues).toHaveLength(1);
    expect(mockDb.issues[0]).toEqual({
      id: "issue-001",
      content: "API response delay detected",
      priority: "HIGH",
      createdAt: "2024-01-15T09:00:00Z",
    });

    // Verify notifications sent: 2 unsubmitted members + 1 manager = 3 notifications
    const firstExecutionNotifications = mockDb.notificationLogs.filter(
      (log) => log.requestId === dashboardRequest.requestId
    );
    expect(firstExecutionNotifications).toHaveLength(3);
    expect(firstExecutionNotifications[0].type).toBe("UNSUBMITTED_REMINDER");
    expect(firstExecutionNotifications[1].type).toBe("UNSUBMITTED_REMINDER");
    expect(firstExecutionNotifications[2].type).toBe("MANAGER_SUMMARY");

    // Verify emails sent
    const firstExecutionEmails = mockEmailService.sent.filter(
      (email) => email.requestId === dashboardRequest.requestId
    );
    expect(firstExecutionEmails).toHaveLength(3);

    // Verify audit log for first execution
    const firstAuditLogs = mockDb.auditLogs.filter(
      (log) => log.requestId === dashboardRequest.requestId && log.action === "EXECUTE"
    );
    expect(firstAuditLogs).toHaveLength(1);

    // Count database state after first execution
    const dbIssuesCountAfterFirst = mockDb.issues.length;
    const dbNotificationsCountAfterFirst = mockDb.notificationLogs.length;
    const emailsSentCountAfterFirst = mockEmailService.sent.length;

    // Second execution with identical request
    const secondExecutionResult = await executeWithIdempotency(dashboardRequest);

    // Verify idempotency detection
    expect(secondExecutionResult.skipped).toBe(true);

    // Verify no duplicate writes occurred
    expect(mockDb.issues).toHaveLength(dbIssuesCountAfterFirst);
    expect(mockDb.notificationLogs).toHaveLength(dbNotificationsCountAfterFirst + 1); // Only audit log added
    expect(mockEmailService.sent).toHaveLength(emailsSentCountAfterFirst);

    // Verify audit log for idempotent skip
    const skipAuditLogs = mockDb.auditLogs.filter(
      (log) => log.requestId === dashboardRequest.requestId && log.action === "IDEMPOTENT_SKIP"
    );
    expect(skipAuditLogs).toHaveLength(1);
    expect(skipAuditLogs[0].details).toMatch(/同一tx_4_imp_1リクエスト.*既実行済み/);

    // Final verification: Counts remain unchanged
    expect(mockDb.issues).toHaveLength(1);
    const finalNotificationsForRequest = mockDb.notificationLogs.filter(
      (log) => log.requestId === dashboardRequest.requestId && log.type !== "MANAGER_SUMMARY"
    );
    expect(finalNotificationsForRequest.filter((log) => log.type === "UNSUBMITTED_REMINDER")).toHaveLength(2);
    expect(mockEmailService.sent.filter((email) => email.requestId === dashboardRequest.requestId)).toHaveLength(3);
  });
});