import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import type {
  Tx4AgentExecutionRequest,
  Tx4AgentExecutionResult,
} from "../../src/agents/tx-4-imp-1/orchestrator";
import type { Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("Tx4Imp1 Orchestrator - Partial Failure Rollback", () => {
  // SCEN-089
  test("should rollback all completed side effects when Action 5 fails mid-execution", async () => {
    const executionId = "exec-test-089-20240115";
    const targetDate = "2024-01-15";
    const executorUserId = "user-dept-chief-001";
    const teamId = "team-engineering-001";

    const executionTimestamp = new Date("2024-01-15T09:00:00Z");

    // Mock data for Actions 1-4 completed state
    const aggregatedReportData = {
      reportCount: 5,
      reports: [
        {
          reportId: "rpt-001",
          submittedAt: "2024-01-15T08:30:00Z",
          content: "Progress on feature X",
        },
        {
          reportId: "rpt-002",
          submittedAt: "2024-01-15T08:45:00Z",
          content: "Issue with database performance",
        },
      ],
    };

    const extractedIssuesData = {
      issueCount: 2,
      issues: [
        {
          issueId: "issue-001",
          category: "performance",
          description: "Database slow query",
          extractedFrom: "rpt-002",
        },
        {
          issueId: "issue-002",
          category: "feature",
          description: "Feature X progress",
          extractedFrom: "rpt-001",
        },
      ],
    };

    const riskAssessmentData = {
      assessmentId: "risk-assess-001",
      assessments: [
        {
          issueId: "issue-001",
          riskScore: 8.5,
          recurrenceRisk: "high",
          pastSimilarIssues: 3,
        },
        {
          issueId: "issue-002",
          riskScore: 3.2,
          recurrenceRisk: "low",
          pastSimilarIssues: 0,
        },
      ],
    };

    const prioritizedIssuesData = {
      priorityId: "priority-list-001",
      prioritizedList: [
        {
          issueId: "issue-001",
          priority: "HIGH",
          priorityScore: 8.5,
          reason: "High recurrence risk and performance impact",
        },
        {
          issueId: "issue-002",
          priority: "LOW",
          priorityScore: 3.2,
          reason: "Isolated feature progress, low risk",
        },
      ],
    };

    // Audit log accumulator
    const auditLogs: Array<{
      timestamp: Date;
      action: string;
      status: string;
      details: unknown;
    }> = [];

    // Data store simulation
    const dataStore: {
      [key: string]: unknown;
    } = {};

    // Mock AI client with controlled failures
    const mockAiClient: Tx4Imp1AiClient = {
      action01AggregateRealtimeData: async () => {
        dataStore["aggregatedData-" + executionId] = aggregatedReportData;
        auditLogs.push({
          timestamp: new Date("2024-01-15T09:01:00Z"),
          action: "ACTION_01_COMPLETE",
          status: "success",
          details: { dataKey: "aggregatedData-" + executionId },
        });
        return aggregatedReportData;
      },

      action02ExtractIssues: async () => {
        dataStore["extractedIssues-" + executionId] = extractedIssuesData;
        auditLogs.push({
          timestamp: new Date("2024-01-15T09:02:00Z"),
          action: "ACTION_02_COMPLETE",
          status: "success",
          details: { dataKey: "extractedIssues-" + executionId },
        });
        return extractedIssuesData;
      },

      action03AssessRecurrenceRisk: async () => {
        dataStore["riskAssessment-" + executionId] = riskAssessmentData;
        auditLogs.push({
          timestamp: new Date("2024-01-15T09:03:00Z"),
          action: "ACTION_03_COMPLETE",
          status: "success",
          details: { dataKey: "riskAssessment-" + executionId },
        });
        return riskAssessmentData;
      },

      action04PrioritizeIssues: async () => {
        dataStore["prioritizedIssues-" + executionId] = prioritizedIssuesData;
        auditLogs.push({
          timestamp: new Date("2024-01-15T09:04:00Z"),
          action: "ACTION_04_COMPLETE",
          status: "success",
          details: { dataKey: "prioritizedIssues-" + executionId },
        });
        return prioritizedIssuesData;
      },

      action05GenerateCountermeasurePlan: async () => {
        // Simulate failure in Action 5
        throw new Error("AI service timeout: Failed to generate countermeasure plan");
      },

      action06CreateDashboardMaterial: async () => {
        return {
          materialId: "material-001",
          content: "Dashboard prepared",
        };
      },

      action07ExtractAndNotifyUnsubmittedMembers: async () => {
        return {
          unsubmittedCount: 0,
          notificationSent: false,
        };
      },

      rollbackAction: async (actionNumber: number, dataKey: string) => {
        delete dataStore[dataKey];
        auditLogs.push({
          timestamp: new Date(),
          action: `ROLLBACK_ACTION_${actionNumber}`,
          status: "success",
          details: { dataKey, deletedKey: dataKey },
        });
      },

      recordAuditEvent: async (event: {
        executionId: string;
        failureTime: Date;
        failedAction: string;
        rolledBackActions: string[];
        rollbackResults: Array<{ action: string; status: string }>;
      }) => {
        auditLogs.push({
          timestamp: event.failureTime,
          action: "AUDIT_FAILURE_RECORDED",
          status: "recorded",
          details: event,
        });
      },
    };

    // Execute orchestrator with injected mock client
    const request: Tx4AgentExecutionRequest = {
      executionTimestamp,
      targetDate,
      executorUserId,
      teamId,
    };

    let resultError: Error | null = null;
    let result: Tx4AgentExecutionResult | null = null;

    try {
      result = await runTx4Imp1Agent(request, mockAiClient);
    } catch (err) {
      resultError = err as Error;
    }

    // Assertions

    // 1. Verify that Action 5 failure was captured
    expect(resultError).toBeTruthy();
    expect(resultError?.message).toMatch(/timeout|countermeasure/i);

    // 2. Verify that all completed side effects were rolled back from dataStore
    expect(dataStore["aggregatedData-" + executionId]).toBeUndefined();
    expect(dataStore["extractedIssues-" + executionId]).toBeUndefined();
    expect(dataStore["riskAssessment-" + executionId]).toBeUndefined();
    expect(dataStore["prioritizedIssues-" + executionId]).toBeUndefined();

    // 3. Verify audit log contains Action 1-4 completion records
    const action01AuditLog = auditLogs.find(
      (log) => log.action === "ACTION_01_COMPLETE"
    );
    expect(action01AuditLog).toBeTruthy();
    expect(action01AuditLog?.status).toBe("success");

    const action02AuditLog = auditLogs.find(
      (log) => log.action === "ACTION_02_COMPLETE"
    );
    expect(action02AuditLog).toBeTruthy();
    expect(action02AuditLog?.status).toBe("success");

    const action03AuditLog = auditLogs.find(
      (log) => log.action === "ACTION_03_COMPLETE"
    );
    expect(action03AuditLog).toBeTruthy();
    expect(action03AuditLog?.status).toBe("success");

    const action04AuditLog = auditLogs.find(
      (log) => log.action === "ACTION_04_COMPLETE"
    );
    expect(action04AuditLog).toBeTruthy();
    expect(action04AuditLog?.status).toBe("success");

    // 4. Verify rollback records exist in audit log for each completed action
    const rollbackAction01Log = auditLogs.find(
      (log) => log.action === "ROLLBACK_ACTION_1"
    );
    expect(rollbackAction01Log).toBeTruthy();
    expect(rollbackAction01Log?.status).toBe("success");

    const rollbackAction02Log = auditLogs.find(
      (log) => log.action === "ROLLBACK_ACTION_2"
    );
    expect(rollbackAction02Log).toBeTruthy();

    const rollbackAction03Log = auditLogs.find(
      (log) => log.action === "ROLLBACK_ACTION_3"
    );
    expect(rollbackAction03Log).toBeTruthy();

    const rollbackAction04Log = auditLogs.find(
      (log) => log.action === "ROLLBACK_ACTION_4"
    );
    expect(rollbackAction04Log).toBeTruthy();

    // 5. Verify audit failure event was recorded with required details
    const failureAuditLog = auditLogs.find(
      (log) => log.action === "AUDIT_FAILURE_RECORDED"
    );
    expect(failureAuditLog).toBeTruthy();
    expect(failureAuditLog?.status).toBe("recorded");

    if (failureAuditLog?.details) {
      const failureDetails = failureAuditLog.details as {
        executionId: string;
        failureTime: Date;
        failedAction: string;
        rolledBackActions: string[];
        rollbackResults: Array<{ action: string; status: string }>;
      };
      expect(failureDetails.executionId).toBe(executionId);
      expect(failureDetails.failedAction).toMatch(/action.*5|countermeasure/i);
      expect(Array.isArray(failureDetails.rolledBackActions)).toBe(true);
      expect(failureDetails.rolledBackActions.length).toBeGreaterThanOrEqual(4);
    }

    // 6. Verify result is null or contains error state
    expect(result).toBeNull();

    // 7. Verify audit log has both completion and rollback entries
    expect(auditLogs.length).toBeGreaterThanOrEqual(9); // 4 completions + 4 rollbacks + 1 failure record
  });
});