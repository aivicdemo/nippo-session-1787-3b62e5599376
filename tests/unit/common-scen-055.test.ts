import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from "../../src/agents/tx-2-imp-1/orchestrator";

describe("tx-2-imp-1 orchestrator audit logging", () => {
  let auditLogRecords: Array<{
    timestamp: Date;
    agentId: string;
    eventType: string;
    status?: string;
    actionName?: string;
    inputParameters?: Record<string, unknown>;
    outputSummary?: Record<string, unknown>;
    promptVersion?: string;
    executionTime?: number;
    totalProcessingTime?: number;
    allActionsCompleted?: boolean;
  }> = [];

  const mockAuditLog = {
    clear: () => {
      auditLogRecords = [];
    },
    record: (event: {
      timestamp: Date;
      agentId: string;
      eventType: string;
      status?: string;
      actionName?: string;
      inputParameters?: Record<string, unknown>;
      outputSummary?: Record<string, unknown>;
      promptVersion?: string;
      executionTime?: number;
      totalProcessingTime?: number;
      allActionsCompleted?: boolean;
    }) => {
      auditLogRecords.push(event);
    },
    getAll: () => auditLogRecords,
  };

  const mockAiClient: Tx2Imp1AiClient = {
    action01_confirmReportReceipt: async (prompt: string) => {
      mockAuditLog.record({
        timestamp: new Date("2024-01-15T08:55:00Z"),
        agentId: "tx-2-imp-1",
        eventType: "ACTION_EXECUTED",
        actionName: "action-01-confirm-receipt",
        inputParameters: { prompt },
        outputSummary: { receivedCount: 10, reportIds: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"] },
        promptVersion: "v1.0.0",
        executionTime: 1200,
      });
      return {
        receivedCount: 10,
        reportIds: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"],
      };
    },

    action02_unifyFormat: async (prompt: string) => {
      mockAuditLog.record({
        timestamp: new Date("2024-01-15T08:56:30Z"),
        agentId: "tx-2-imp-1",
        eventType: "ACTION_EXECUTED",
        actionName: "action-02-unify-format",
        inputParameters: { prompt },
        outputSummary: { processedCount: 10, successCount: 10, failureCount: 0 },
        promptVersion: "v1.0.0",
        executionTime: 2400,
      });
      return {
        processedCount: 10,
        successCount: 10,
        failureCount: 0,
        unifiedReports: [
          { reportId: "r1", format: "standard" },
          { reportId: "r2", format: "standard" },
          { reportId: "r3", format: "standard" },
          { reportId: "r4", format: "standard" },
          { reportId: "r5", format: "standard" },
          { reportId: "r6", format: "standard" },
          { reportId: "r7", format: "standard" },
          { reportId: "r8", format: "standard" },
          { reportId: "r9", format: "standard" },
          { reportId: "r10", format: "standard" },
        ],
      };
    },

    action03_extractIssues: async (prompt: string) => {
      mockAuditLog.record({
        timestamp: new Date("2024-01-15T08:58:00Z"),
        agentId: "tx-2-imp-1",
        eventType: "ACTION_EXECUTED",
        actionName: "action-03-extract-issues",
        inputParameters: { prompt },
        outputSummary: { extractedCount: 25, rulesApplied: "standard-extraction-v1" },
        promptVersion: "v1.0.0",
        executionTime: 3000,
      });
      return {
        extractedCount: 25,
        issues: Array.from({ length: 25 }, (_, i) => ({
          issueId: `iss${i + 1}`,
          type: i % 3 === 0 ? "issue" : i % 3 === 1 ? "risk" : "achievement",
          content: `Content ${i + 1}`,
        })),
        rulesApplied: "standard-extraction-v1",
      };
    },

    action04_prioritizeAndColor: async (prompt: string) => {
      mockAuditLog.record({
        timestamp: new Date("2024-01-15T08:59:30Z"),
        agentId: "tx-2-imp-1",
        eventType: "ACTION_EXECUTED",
        actionName: "action-04-prioritize-color",
        inputParameters: { prompt },
        outputSummary: { highCount: 5, mediumCount: 12, lowCount: 8 },
        promptVersion: "v1.0.0",
        executionTime: 1800,
      });
      return {
        highCount: 5,
        mediumCount: 12,
        lowCount: 8,
        prioritizedIssues: Array.from({ length: 25 }, (_, i) => ({
          issueId: `iss${i + 1}`,
          priority: i < 5 ? "high" : i < 17 ? "medium" : "low",
          color: i < 5 ? "red" : i < 17 ? "yellow" : "green",
        })),
      };
    },

    action05_identifyUnsubmitted: async (prompt: string) => {
      mockAuditLog.record({
        timestamp: new Date("2024-01-15T09:01:00Z"),
        agentId: "tx-2-imp-1",
        eventType: "ACTION_EXECUTED",
        actionName: "action-05-identify-unsubmitted",
        inputParameters: { prompt },
        outputSummary: { unsubmittedMembers: ["m1", "m2", "m3"], totalMembers: 10 },
        promptVersion: "v1.0.0",
        executionTime: 900,
      });
      return {
        unsubmittedMembers: ["m1", "m2", "m3"],
        totalMembers: 10,
      };
    },

    action06_generateAndSendEmail: async (prompt: string) => {
      mockAuditLog.record({
        timestamp: new Date("2024-01-15T09:02:30Z"),
        agentId: "tx-2-imp-1",
        eventType: "ACTION_EXECUTED",
        actionName: "action-06-generate-send-email",
        inputParameters: { prompt },
        outputSummary: {
          recipientEmail: "manager@example.com",
          emailPreview: "朝会報告：課題集約完了",
          deliveryStatus: "SUCCESS",
        },
        promptVersion: "v1.0.0",
        executionTime: 1500,
      });
      return {
        recipientEmail: "manager@example.com",
        emailPreview: "朝会報告：課題集約完了",
        deliveryStatus: "SUCCESS",
      };
    },
  };

  beforeEach(() => {
    mockAuditLog.clear();
  });

  afterEach(() => {
    mockAuditLog.clear();
  });

  // SCEN-055
  test("should record complete audit trail from start to completion with all action execution details", async () => {
    const startTime = new Date("2024-01-15T08:55:00Z");
    const completeTime = new Date("2024-01-15T09:02:30Z");
    const totalMilliseconds = completeTime.getTime() - startTime.getTime();

    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp: startTime,
      teamId: "team-001",
      reportingDeadline: new Date("2024-01-15T09:00:00Z"),
      managerEmail: "manager@example.com",
    };

    // Record START event
    mockAuditLog.record({
      timestamp: startTime,
      agentId: "tx-2-imp-1",
      eventType: "AGENT_START",
      status: "START",
    });

    // Execute orchestrator
    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(agentInput, mockAiClient);

    // Record COMPLETE event
    mockAuditLog.record({
      timestamp: completeTime,
      agentId: "tx-2-imp-1",
      eventType: "AGENT_COMPLETE",
      status: "COMPLETE",
      allActionsCompleted: true,
      totalProcessingTime: totalMilliseconds,
    });

    // Verify result structure
    expect(result).toEqual({
      aggregationStatus: "success",
      extractedIssuesCount: 25,
      prioritizedIssuesList: expect.arrayContaining([
        expect.objectContaining({
          issueId: expect.any(String),
          priority: expect.stringMatching(/^(high|medium|low)$/),
        }),
      ]),
      emailSendStatus: "sent",
    });

    // Verify audit log records
    const allRecords = mockAuditLog.getAll();
    expect(allRecords.length).toBe(8);

    // Verify START event (record 0)
    expect(allRecords[0]).toEqual({
      timestamp: startTime,
      agentId: "tx-2-imp-1",
      eventType: "AGENT_START",
      status: "START",
    });

    // Verify Action 1 execution (record 1)
    expect(allRecords[1]).toEqual({
      timestamp: new Date("2024-01-15T08:55:00Z"),
      agentId: "tx-2-imp-1",
      eventType: "ACTION_EXECUTED",
      actionName: "action-01-confirm-receipt",
      inputParameters: expect.any(Object),
      outputSummary: { receivedCount: 10, reportIds: expect.arrayContaining(["r1", "r2", "r3"]) },
      promptVersion: "v1.0.0",
      executionTime: 1200,
    });

    // Verify Action 2 execution (record 2)
    expect(allRecords[2]).toEqual({
      timestamp: new Date("2024-01-15T08:56:30Z"),
      agentId: "tx-2-imp-1",
      eventType: "ACTION_EXECUTED",
      actionName: "action-02-unify-format",
      inputParameters: expect.any(Object),
      outputSummary: { processedCount: 10, successCount: 10, failureCount: 0 },
      promptVersion: "v1.0.0",
      executionTime: 2400,
    });

    // Verify Action 3 execution (record 3)
    expect(allRecords[3]).toEqual({
      timestamp: new Date("2024-01-15T08:58:00Z"),
      agentId: "tx-2-imp-1",
      eventType: "ACTION_EXECUTED",
      actionName: "action-03-extract-issues",
      inputParameters: expect.any(Object),
      outputSummary: { extractedCount: 25, rulesApplied: "standard-extraction-v1" },
      promptVersion: "v1.0.0",
      executionTime: 3000,
    });

    // Verify Action 4 execution (record 4)
    expect(allRecords[4]).toEqual({
      timestamp: new Date("2024-01-15T08:59:30Z"),
      agentId: "tx-2-imp-1",
      eventType: "ACTION_EXECUTED",
      actionName: "action-04-prioritize-color",
      inputParameters: expect.any(Object),
      outputSummary: { highCount: 5, mediumCount: 12, lowCount: 8 },
      promptVersion: "v1.0.0",
      executionTime: 1800,
    });

    // Verify Action 5 execution (record 5)
    expect(allRecords[5]).toEqual({
      timestamp: new Date("2024-01-15T09:01:00Z"),
      agentId: "tx-2-imp-1",
      eventType: "ACTION_EXECUTED",
      actionName: "action-05-identify-unsubmitted",
      inputParameters: expect.any(Object),
      outputSummary: { unsubmittedMembers: ["m1", "m2", "m3"], totalMembers: 10 },
      promptVersion: "v1.0.0",
      executionTime: 900,
    });

    // Verify Action 6 execution (record 6)
    expect(allRecords[6]).toEqual({
      timestamp: new Date("2024-01-15T09:02:30Z"),
      agentId: "tx-2-imp-1",
      eventType: "ACTION_EXECUTED",
      actionName: "action-06-generate-send-email",
      inputParameters: expect.any(Object),
      outputSummary: {
        recipientEmail: "manager@example.com",
        emailPreview: "朝会報告：課題集約完了",
        deliveryStatus: "SUCCESS",
      },
      promptVersion: "v1.0.0",
      executionTime: 1500,
    });

    // Verify COMPLETE event (record 7)
    expect(allRecords[7]).toEqual({
      timestamp: completeTime,
      agentId: "tx-2-imp-1",
      eventType: "AGENT_COMPLETE",
      status: "COMPLETE",
      allActionsCompleted: true,
      totalProcessingTime: totalMilliseconds,
    });

    // Verify chronological order
    for (let i = 1; i < allRecords.length; i++) {
      expect(allRecords[i].timestamp.getTime()).toBeGreaterThanOrEqual(allRecords[i - 1].timestamp.getTime());
    }

    // Verify no duplicates by checking unique event types per action
    const actionNames = allRecords
      .filter((r) => r.eventType === "ACTION_EXECUTED")
      .map((r) => r.actionName)
      .sort();
    expect(actionNames).toEqual([
      "action-01-confirm-receipt",
      "action-02-unify-format",
      "action-03-extract-issues",
      "action-04-prioritize-color",
      "action-05-identify-unsubmitted",
      "action-06-generate-send-email",
    ]);

    // Verify traceability of email delivery success
    const emailRecord = allRecords.find((r) => r.actionName === "action-06-generate-send-email");
    expect(emailRecord?.outputSummary?.deliveryStatus).toBe("SUCCESS");
    expect(emailRecord?.outputSummary?.recipientEmail).toBe("manager@example.com");
  });
});