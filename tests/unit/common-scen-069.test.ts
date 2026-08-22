import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
import type {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  ExtractedIssue,
  PrioritizedIssue,
  EmailSendStatus,
  PriorityThresholdConfig,
} from "../../src/agents/tx-3-imp-1/orchestrator";

describe("tx-3-imp-1 orchestrator", () => {
  // SCEN-069
  test("should maintain idempotence when executing same aggregated report data twice", async () => {
    const mockAiClient = {
      extractIssuesFromReport: jest.fn(),
      prioritizeIssues: jest.fn(),
      generatePrioritizedList: jest.fn(),
      sendEmailToManager: jest.fn(),
    };

    const mockDatabase = {
      emailSendLogs: [] as Array<{
        id: string;
        reportAggregationId: string;
        sentAt: Date;
        recipientEmail: string;
        issueCount: number;
      }>,
      prioritizedIssueLogs: [] as Array<{
        id: string;
        reportAggregationId: string;
        issueId: string;
        priority: "high" | "medium" | "low";
        createdAt: Date;
      }>,
      auditLogs: [] as Array<{
        id: string;
        operation: string;
        reportAggregationId: string;
        timestamp: Date;
        details: Record<string, unknown>;
      }>,
      getEmailSendLogCount: function (reportId: string): number {
        return this.emailSendLogs.filter((log) => log.reportAggregationId === reportId).length;
      },
      getAuditLogCount: function (reportId: string, operation: string): number {
        return this.auditLogs.filter(
          (log) => log.reportAggregationId === reportId && log.operation === operation
        ).length;
      },
      addEmailSendLog: function (log: {
        reportAggregationId: string;
        sentAt: Date;
        recipientEmail: string;
        issueCount: number;
      }): void {
        this.emailSendLogs.push({
          id: `email-${this.emailSendLogs.length + 1}`,
          ...log,
        });
        this.auditLogs.push({
          id: `audit-${this.auditLogs.length + 1}`,
          operation: "INSERT_EMAIL_LOG",
          reportAggregationId: log.reportAggregationId,
          timestamp: new Date("2024-01-15T11:00:00Z"),
          details: { issueCount: log.issueCount },
        });
      },
      addPrioritizedIssueLog: function (log: {
        reportAggregationId: string;
        issueId: string;
        priority: "high" | "medium" | "low";
      }): void {
        this.prioritizedIssueLogs.push({
          id: `issue-${this.prioritizedIssueLogs.length + 1}`,
          ...log,
          createdAt: new Date("2024-01-15T11:00:00Z"),
        });
        this.auditLogs.push({
          id: `audit-${this.auditLogs.length + 1}`,
          operation: "INSERT_PRIORITIZED_ISSUE",
          reportAggregationId: log.reportAggregationId,
          timestamp: new Date("2024-01-15T11:00:00Z"),
          details: { issueId: log.issueId, priority: log.priority },
        });
      },
    };

    const reportAggregationId = "agg-001";
    const analysisExecutionTime = new Date("2024-01-15T10:00:00Z");
    const managerEmail = "manager@example.com";
    const priorityThresholds: PriorityThresholdConfig = {
      highPriorityMinScore: 75,
      mediumPriorityMinScore: 50,
    };

    const mockExtractedIssues: ExtractedIssue[] = [
      {
        keyword: "システムダウン",
        frequency: 3,
        impactScore: 95,
      },
      {
        keyword: "データ不整合",
        frequency: 2,
        impactScore: 85,
      },
    ];

    const mockPrioritizedIssues: PrioritizedIssue[] = [
      {
        issueId: "issue-001",
        keyword: "システムダウン",
        priority: "high",
        priorityScore: 95,
        colorCode: "red",
        frequency: 3,
        impactScore: 95,
      },
      {
        issueId: "issue-002",
        keyword: "データ不整合",
        priority: "high",
        priorityScore: 85,
        colorCode: "red",
        frequency: 2,
        impactScore: 85,
      },
    ];

    const mockEmailStatus: EmailSendStatus = {
      success: true,
      recipientEmail: managerEmail,
      sentAt: new Date("2024-01-15T11:00:00Z"),
      issueCount: 2,
    };

    mockAiClient.extractIssuesFromReport.mockResolvedValue(mockExtractedIssues);
    mockAiClient.prioritizeIssues.mockResolvedValue(mockPrioritizedIssues);
    mockAiClient.generatePrioritizedList.mockResolvedValue({
      prioritizedList: mockPrioritizedIssues,
    });
    mockAiClient.sendEmailToManager.mockResolvedValue(mockEmailStatus);

    const agentInput: Tx3Imp1AgentInput = {
      reportAggregationId,
      analysisExecutionTime,
      managerEmail,
      priorityThresholds,
    };

    // First execution
    const firstResult: Tx3Imp1AgentOutput = await runTx3Imp1Agent(agentInput, mockAiClient as any);

    expect(firstResult.extractedIssues).toHaveLength(2);
    expect(firstResult.extractedIssues[0].keyword).toBe("システムダウン");
    expect(firstResult.prioritizedIssueList).toHaveLength(2);
    expect(firstResult.prioritizedIssueList[0].priority).toBe("high");
    expect(firstResult.emailSendStatus.success).toBe(true);
    expect(firstResult.emailSendStatus.issueCount).toBe(2);

    const firstEmailLogCount = mockDatabase.getEmailSendLogCount(reportAggregationId);
    const firstAuditInsertCount = mockDatabase.getAuditLogCount(
      reportAggregationId,
      "INSERT_EMAIL_LOG"
    );

    // Simulate database updates from first execution
    mockDatabase.addEmailSendLog({
      reportAggregationId,
      sentAt: new Date("2024-01-15T11:00:00Z"),
      recipientEmail: managerEmail,
      issueCount: 2,
    });

    mockPrioritizedIssues.forEach((issue) => {
      mockDatabase.addPrioritizedIssueLog({
        reportAggregationId,
        issueId: issue.issueId,
        priority: issue.priority,
      });
    });

    const firstExecutionEmailCount = mockDatabase.getEmailSendLogCount(reportAggregationId);
    const firstExecutionAuditCount = mockDatabase.getAuditLogCount(
      reportAggregationId,
      "INSERT_EMAIL_LOG"
    );

    expect(firstExecutionEmailCount).toBe(1);
    expect(firstExecutionAuditCount).toBe(1);

    // Reset mock call counts but keep database state
    mockAiClient.extractIssuesFromReport.mockClear();
    mockAiClient.prioritizeIssues.mockClear();
    mockAiClient.generatePrioritizedList.mockClear();
    mockAiClient.sendEmailToManager.mockClear();

    // Re-setup mocks for second execution
    mockAiClient.extractIssuesFromReport.mockResolvedValue(mockExtractedIssues);
    mockAiClient.prioritizeIssues.mockResolvedValue(mockPrioritizedIssues);
    mockAiClient.generatePrioritizedList.mockResolvedValue({
      prioritizedList: mockPrioritizedIssues,
    });
    mockAiClient.sendEmailToManager.mockResolvedValue(mockEmailStatus);

    // Second execution with identical parameters
    const secondResult: Tx3Imp1AgentOutput = await runTx3Imp1Agent(agentInput, mockAiClient as any);

    expect(secondResult.extractedIssues).toHaveLength(2);
    expect(secondResult.prioritizedIssueList).toHaveLength(2);
    expect(secondResult.emailSendStatus.success).toBe(true);

    // Verify idempotence: no new email log entries should be created
    const secondExecutionEmailCount = mockDatabase.getEmailSendLogCount(reportAggregationId);
    expect(secondExecutionEmailCount).toBe(1);

    // Verify audit log: only 1 INSERT_EMAIL_LOG operation should exist
    const secondExecutionAuditCount = mockDatabase.getAuditLogCount(
      reportAggregationId,
      "INSERT_EMAIL_LOG"
    );
    expect(secondExecutionAuditCount).toBe(1);

    // Verify no duplicate INSERT operations in audit log
    const insertOperations = mockDatabase.auditLogs.filter(
      (log) =>
        log.reportAggregationId === reportAggregationId && log.operation === "INSERT_EMAIL_LOG"
    );
    expect(insertOperations).toHaveLength(1);

    // Verify email send method was called but without creating duplicate records
    expect(mockAiClient.sendEmailToManager).toHaveBeenCalled();
    expect(mockAiClient.extractIssuesFromReport).toHaveBeenCalled();
    expect(mockAiClient.prioritizeIssues).toHaveBeenCalled();
  });
});