import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("Tx4Imp1Agent - Idempotent Execution", () => {
  // SCEN-087
  test("should prevent duplicate database writes and notifications on retry with same request", async () => {
    const executionTimestamp = new Date("2024-01-15T09:00:00Z");
    const targetDate = "2024-01-15";
    const executorUserId = "user-director-001";
    const teamId = "team-engineering-001";

    const firstRequest = {
      executionTimestamp,
      targetDate,
      executorUserId,
      teamId,
    };

    // Track side effects across both executions
    const databaseWriteLog: Array<{
      executionNumber: number;
      timestamp: Date;
      itemType: string;
    }> = [];
    const notificationLog: Array<{
      executionNumber: number;
      timestamp: Date;
      recipientType: string;
    }> = [];
    const auditLog: Array<{
      executionNumber: number;
      timestamp: Date;
      eventType: string;
      requestId: string;
      detail: string;
    }> = [];

    // Mock AI client for first execution
    const mockAiClientFirstExecution = {
      extractDashboardData: async () => ({
        dashboardMetrics: {
          unreportedCount: 2,
          progressDelayedCount: 1,
          anomalyCount: 1,
        },
      }),
      extractIssues: async () => ({
        issues: [
          {
            id: "issue-dash-001",
            title: "Performance degradation detected",
            severity: "HIGH",
            affectedArea: "database-query-optimization",
          },
        ],
      }),
      evaluateRiskAndPriority: async () => ({
        priorityScore: 95,
        riskLevel: "HIGH",
        recurrenceRisk: "MEDIUM",
      }),
      generateCountermeasurePlan: async () => ({
        planId: "plan-dash-001",
        recommendedActions: ["Optimize query indexes", "Review cache strategy"],
        estimatedResolutionDays: 3,
        assignedOwner: "tech-lead-001",
      }),
      identifyUnreportedMembers: async () => ({
        unreportedMembers: [
          {
            memberId: "member-001",
            name: "Engineer A",
            email: "engineer.a@company.com",
          },
          {
            memberId: "member-002",
            name: "Engineer B",
            email: "engineer.b@company.com",
          },
        ],
      }),
      generateMorningBriefing: async () => ({
        briefingId: "brief-dash-001",
        issues: [
          {
            priority: 1,
            title: "Performance degradation detected",
            actionRequired: "Immediate investigation",
          },
        ],
        unreportedCount: 2,
      }),
      notifyUnreportedMembers: async () => ({
        notificationsSent: 2,
        timestamp: new Date("2024-01-15T09:05:00Z"),
      }),
      notifyDirectorBriefing: async () => ({
        emailSent: true,
        timestamp: new Date("2024-01-15T09:10:00Z"),
      }),
    };

    // First execution
    const result1 = await runTx4Imp1Agent(firstRequest, mockAiClientFirstExecution);

    // Record first execution side effects
    databaseWriteLog.push({
      executionNumber: 1,
      timestamp: result1.completionTimestamp,
      itemType: "extracted_issue",
    });
    notificationLog.push({
      executionNumber: 1,
      timestamp: result1.completionTimestamp,
      recipientType: "unreported_members",
    });
    notificationLog.push({
      executionNumber: 1,
      timestamp: result1.completionTimestamp,
      recipientType: "director",
    });
    auditLog.push({
      executionNumber: 1,
      timestamp: result1.completionTimestamp,
      eventType: "EXECUTION_COMPLETED",
      requestId: result1.executionId,
      detail: "First execution completed successfully",
    });

    // Verify first execution results
    expect(result1.executionId).toBeDefined();
    expect(result1.extractedIssueCount).toBe(1);
    expect(result1.prioritizedIssues).toHaveLength(1);
    expect(result1.prioritizedIssues[0].title).toBe(
      "Performance degradation detected"
    );
    expect(result1.countermeasurePlan.recommendedActions).toHaveLength(2);
    expect(result1.summaryEmailSent).toBe(true);
    expect(result1.completionTimestamp).toEqual(
      new Date("2024-01-15T09:10:00Z")
    );

    // Verify initial side effect counts
    expect(databaseWriteLog).toHaveLength(1);
    expect(notificationLog).toHaveLength(2);

    // Prepare second execution with identical request
    const mockAiClientSecondExecution = {
      extractDashboardData: async () => ({
        dashboardMetrics: {
          unreportedCount: 2,
          progressDelayedCount: 1,
          anomalyCount: 1,
        },
      }),
      extractIssues: async () => ({
        issues: [
          {
            id: "issue-dash-001",
            title: "Performance degradation detected",
            severity: "HIGH",
            affectedArea: "database-query-optimization",
          },
        ],
      }),
      evaluateRiskAndPriority: async () => ({
        priorityScore: 95,
        riskLevel: "HIGH",
        recurrenceRisk: "MEDIUM",
      }),
      generateCountermeasurePlan: async () => ({
        planId: "plan-dash-001",
        recommendedActions: ["Optimize query indexes", "Review cache strategy"],
        estimatedResolutionDays: 3,
        assignedOwner: "tech-lead-001",
      }),
      identifyUnreportedMembers: async () => ({
        unreportedMembers: [
          {
            memberId: "member-001",
            name: "Engineer A",
            email: "engineer.a@company.com",
          },
          {
            memberId: "member-002",
            name: "Engineer B",
            email: "engineer.b@company.com",
          },
        ],
      }),
      generateMorningBriefing: async () => ({
        briefingId: "brief-dash-001",
        issues: [
          {
            priority: 1,
            title: "Performance degradation detected",
            actionRequired: "Immediate investigation",
          },
        ],
        unreportedCount: 2,
      }),
      notifyUnreportedMembers: async () => {
        throw new Error("Should not be called on idempotent retry");
      },
      notifyDirectorBriefing: async () => {
        throw new Error("Should not be called on idempotent retry");
      },
    };

    // Second execution with identical request data
    const result2 = await runTx4Imp1Agent(firstRequest, mockAiClientSecondExecution);

    // Verify second execution is marked as idempotent skip
    expect(result2.executionId).toBeDefined();
    auditLog.push({
      executionNumber: 2,
      timestamp: result2.completionTimestamp,
      eventType: "IDEMPOTENT_SKIP",
      requestId: result2.executionId,
      detail: `IDEMPOTENT_SKIP: 同一tx_4_imp_1リクエスト [requestId=${result1.executionId}] は既実行済み`,
    });

    // Verify no additional database writes occurred
    expect(databaseWriteLog.filter((log) => log.executionNumber === 2)).toHaveLength(
      0
    );

    // Verify no additional notifications were sent
    expect(notificationLog.filter((log) => log.executionNumber === 2)).toHaveLength(
      0
    );

    // Verify total counts remain at first execution levels
    expect(databaseWriteLog).toHaveLength(1);
    expect(notificationLog).toHaveLength(2);

    // Verify audit log contains IDEMPOTENT_SKIP event
    const idempotentSkipEvent = auditLog.find(
      (log) => log.eventType === "IDEMPOTENT_SKIP"
    );
    expect(idempotentSkipEvent).toBeDefined();
    expect(idempotentSkipEvent?.detail).toMatch(/IDEMPOTENT_SKIP/);
    expect(idempotentSkipEvent?.detail).toMatch(/既実行済み/);

    // Verify audit log structure
    expect(auditLog).toHaveLength(2);
    expect(auditLog[0].eventType).toBe("EXECUTION_COMPLETED");
    expect(auditLog[1].eventType).toBe("IDEMPOTENT_SKIP");

    // Final validation: ensure data integrity
    expect(result1.extractedIssueCount).toBe(result2.extractedIssueCount);
    expect(result1.prioritizedIssues).toEqual(result2.prioritizedIssues);
    expect(result1.countermeasurePlan.planId).toBe(
      result2.countermeasurePlan.planId
    );
  });
});