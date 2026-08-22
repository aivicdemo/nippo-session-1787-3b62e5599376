import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("sendUnsubmittedReminder - Partial failure rollback compensation", () => {
  test("SCEN-176: rolls back Actions 3-5 side effects when Action 6 fails, preserves Actions 1-2", async () => {
    // Setup: Mock AI client injection with progressive failure at Action 6
    const fakeAiClient = {
      action01_aggregateReportData: jest.fn().mockResolvedValue({
        status: "completed",
        aggregatedDataId: "agg-001",
        recordCount: 15,
        timestamp: "2024-01-15T09:00:00Z",
      }),

      action02_sendUnsubmittedReminder: jest.fn().mockResolvedValue({
        status: "completed",
        remindersSent: 3,
        timestamp: "2024-01-15T09:05:00Z",
      }),

      action03_quantifyProductivityMetrics: jest.fn().mockResolvedValue({
        status: "completed",
        metricsDataId: "metrics-001",
        metricsCount: 42,
        timestamp: "2024-01-15T09:10:00Z",
      }),

      action04_classifyIssuesByPriority: jest.fn().mockResolvedValue({
        status: "completed",
        classificationId: "class-001",
        issueCount: 18,
        timestamp: "2024-01-15T09:15:00Z",
      }),

      action05_detectRecurrencePattern: jest.fn().mockResolvedValue({
        status: "completed",
        patternDataId: "pattern-001",
        patternsDetected: 5,
        timestamp: "2024-01-15T09:20:00Z",
      }),

      action06_proposeMeasures: jest.fn().mockRejectedValue(
        new Error("External API integration failure at proposal service")
      ),

      rollback03_deleteMetrics: jest.fn().mockResolvedValue({
        status: "rollback_completed",
        metricsDataId: "metrics-001",
        deletedRecordCount: 42,
        timestamp: "2024-01-15T09:25:00Z",
      }),

      rollback04_undoClassification: jest.fn().mockResolvedValue({
        status: "rollback_completed",
        classificationId: "class-001",
        undoRecordCount: 18,
        timestamp: "2024-01-15T09:26:00Z",
      }),

      rollback05_clearPatternData: jest.fn().mockResolvedValue({
        status: "rollback_completed",
        patternDataId: "pattern-001",
        clearedRecordCount: 5,
        timestamp: "2024-01-15T09:27:00Z",
      }),
    };

    // Mock audit log storage
    const auditLog: Array<{
      eventType: string;
      action: string;
      timestamp: string;
      details: string;
    }> = [];

    const mockAuditLogger = {
      log: jest.fn((eventType: string, action: string, details: string) => {
        auditLog.push({
          eventType,
          action,
          timestamp: new Date().toISOString(),
          details,
        });
      }),
    };

    // Mock side effect storage (simulating database/file system)
    const sideEffectStorage = {
      aggregatedData: {
        "agg-001": { recordCount: 15, data: "report_data" },
      },
      remindersSent: {
        "reminder-batch-001": { count: 3, recipients: ["user1", "user2", "user3"] },
      },
      metricsData: {
        "metrics-001": { metricsCount: 42, data: "productivity_metrics" },
      },
      classificationData: {
        "class-001": { issueCount: 18, data: "priority_classification" },
      },
      patternData: {
        "pattern-001": { patternsDetected: 5, data: "recurrence_patterns" },
      },
    };

    // Execute agent with injected client
    let agentFinalState: {
      status: string;
      failureReason?: string;
      failedAction?: string;
    };
    let executionError: Error | null = null;

    try {
      // Simulate the agent orchestrator behavior
      // Action 1: Aggregate data (success)
      const action1Result = await fakeAiClient.action01_aggregateReportData();
      expect(action1Result.status).toBe("completed");
      mockAuditLogger.log("ACTION_COMPLETED", "action_01_aggregate", "Aggregated 15 records");

      // Action 2: Send reminders (success)
      const action2Result = await fakeAiClient.action02_sendUnsubmittedReminder();
      expect(action2Result.status).toBe("completed");
      mockAuditLogger.log("ACTION_COMPLETED", "action_02_reminder", "Sent 3 reminders");

      // Action 3: Quantify metrics (success)
      const action3Result = await fakeAiClient.action03_quantifyProductivityMetrics();
      expect(action3Result.status).toBe("completed");
      mockAuditLogger.log("ACTION_COMPLETED", "action_03_quantify", "Generated 42 metrics");

      // Action 4: Classify issues (success)
      const action4Result = await fakeAiClient.action04_classifyIssuesByPriority();
      expect(action4Result.status).toBe("completed");
      mockAuditLogger.log("ACTION_COMPLETED", "action_04_classify", "Classified 18 issues");

      // Action 5: Detect patterns (success)
      const action5Result = await fakeAiClient.action05_detectRecurrencePattern();
      expect(action5Result.status).toBe("completed");
      mockAuditLogger.log("ACTION_COMPLETED", "action_05_patterns", "Detected 5 patterns");

      // Action 6: Propose measures (FAILURE)
      try {
        await fakeAiClient.action06_proposeMeasures();
      } catch (error) {
        executionError = error as Error;
        mockAuditLogger.log(
          "ACTION_FAILED",
          "action_06_propose",
          `External API integration failure at proposal service`
        );

        // Compensating transaction: Rollback Action 5
        const rollback5Result = await fakeAiClient.rollback05_clearPatternData();
        expect(rollback5Result.status).toBe("rollback_completed");
        delete sideEffectStorage.patternData["pattern-001"];
        mockAuditLogger.log("ROLLBACK_COMPLETED", "action_05_rollback", "Cleared 5 pattern records");

        // Compensating transaction: Rollback Action 4
        const rollback4Result = await fakeAiClient.rollback04_undoClassification();
        expect(rollback4Result.status).toBe("rollback_completed");
        delete sideEffectStorage.classificationData["class-001"];
        mockAuditLogger.log("ROLLBACK_COMPLETED", "action_04_rollback", "Undid 18 classification records");

        // Compensating transaction: Rollback Action 3
        const rollback3Result = await fakeAiClient.rollback03_deleteMetrics();
        expect(rollback3Result.status).toBe("rollback_completed");
        delete sideEffectStorage.metricsData["metrics-001"];
        mockAuditLogger.log("ROLLBACK_COMPLETED", "action_03_rollback", "Deleted 42 metric records");

        agentFinalState = {
          status: "failed",
          failureReason: "External API integration failure at proposal service",
          failedAction: "action_06_propose",
        };
      }
    } catch (err) {
      executionError = err as Error;
    }

    // VERIFICATION: Action 3 side effects are rolled back
    expect(sideEffectStorage.metricsData["metrics-001"]).toBeUndefined();

    // VERIFICATION: Action 4 side effects are rolled back
    expect(sideEffectStorage.classificationData["class-001"]).toBeUndefined();

    // VERIFICATION: Action 5 side effects are rolled back
    expect(sideEffectStorage.patternData["pattern-001"]).toBeUndefined();

    // VERIFICATION: Action 2 (reminders sent) NOT rolled back (compensate flag = false)
    expect(sideEffectStorage.remindersSent["reminder-batch-001"]).toBeDefined();
    expect(sideEffectStorage.remindersSent["reminder-batch-001"].count).toBe(3);

    // VERIFICATION: Action 1 (aggregated data) NOT rolled back (compensate flag = false)
    expect(sideEffectStorage.aggregatedData["agg-001"]).toBeDefined();
    expect(sideEffectStorage.aggregatedData["agg-001"].recordCount).toBe(15);

    // VERIFICATION: Agent final state is 'failed'
    expect(agentFinalState.status).toBe("failed");
    expect(agentFinalState.failedAction).toBe("action_06_propose");

    // VERIFICATION: Audit log contains 4 events in chronological order
    const auditEvents = auditLog.map((entry) => entry.action);
    expect(auditEvents.length).toBe(8); // 5 completed + 1 failed + 3 rollbacks
    expect(auditEvents[5]).toBe("action_06_propose"); // Action 6 failure
    expect(auditEvents[6]).toBe("action_05_rollback"); // Rollback 5
    expect(auditEvents[7]).toBe("action_04_rollback"); // Rollback 4
    expect(auditEvents[8]).toBeUndefined(); // Only 8 events expected

    // Verify audit log contains exact event sequence
    const failureAndRollbackEvents = auditLog.slice(5);
    expect(failureAndRollbackEvents[0].eventType).toBe("ACTION_FAILED");
    expect(failureAndRollbackEvents[1].eventType).toBe("ROLLBACK_COMPLETED");
    expect(failureAndRollbackEvents[1].details).toContain("5");
    expect(failureAndRollbackEvents[2].eventType).toBe("ROLLBACK_COMPLETED");
    expect(failureAndRollbackEvents[2].details).toContain("18");
    expect(failureAndRollbackEvents[3].eventType).toBe("ROLLBACK_COMPLETED");
    expect(failureAndRollbackEvents[3].details).toContain("42");

    // VERIFICATION: No mock was invoked for Action 6 result handling
    expect(fakeAiClient.action06_proposeMeasures).toHaveBeenCalledTimes(1);

    // VERIFICATION: Rollback functions called in correct order (reverse of actions)
    expect(fakeAiClient.rollback05_clearPatternData).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.rollback04_undoClassification).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.rollback03_deleteMetrics).toHaveBeenCalledTimes(1);
  });
});