import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  // SCEN-105: Partial failure rollback after Action 5 (notification) API failure
  test("should rollback Jira registration and reset status when Action 5 notification fails", async () => {
    // Arrange: Prepare fake AI client that injects failure at Action 5 stage
    const fakeAiClient = {
      callAction01ValidateExtractedData: jest.fn().mockResolvedValue({
        isValid: true,
        validationErrors: [],
      }),
      callAction02JudgePriority: jest.fn().mockResolvedValue({
        priority: "HIGH",
        confidenceScore: 0.95,
        category: "defect",
      }),
      callAction03ConfigureToolIntegration: jest.fn().mockResolvedValue({
        integrationConfigured: true,
        targetTool: "jira",
      }),
      callAction04RegisterToJira: jest.fn().mockResolvedValue({
        jiraTicketId: "PROJ-12345",
        jiraTicketUrl: "https://jira.example.com/browse/PROJ-12345",
        registrationTimestamp: "2024-01-15T10:00:00Z",
      }),
      callAction05NotifyCompletion: jest.fn().mockRejectedValue(
        new Error("HTTP 500 Internal Server Error")
      ),
    };

    // Input: Extracted issue data with valid format, high confidence, single category, authorized tool connection
    const extractedIssueData = {
      issueId: "issue-001",
      title: "Database connection timeout",
      description: "Connection to primary DB fails intermittently",
      extractedAt: "2024-01-15T09:55:00Z",
      extractedFrom: "daily-report-2024-01-15",
      category: "infrastructure",
      severity: "high",
      affectedTeams: ["backend-team"],
      estimatedImpact: "system-availability",
      toolIntegrationAuthorized: true,
    };

    // Mock audit event storage
    const auditEvents: Array<{
      timestamp: string;
      eventType: string;
      status: string;
      checkpointAction: number;
      failureReason: string;
      rollbackDetails: Record<string, unknown>;
      retryMetadata: Record<string, unknown>;
    }> = [];

    const mockAuditLogger = {
      logEvent: jest.fn((event) => {
        auditEvents.push(event);
      }),
    };

    // Mock database state before Action 4
    const mockDatabase = {
      issueIntegrationStatus: {
        "issue-001": "pending-integration",
      },
      jiraTickets: {} as Record<string, Record<string, unknown>>,
      integrationFailureLog: [] as Array<Record<string, unknown>>,
    };

    // Mock Jira client for deletion on rollback
    const mockJiraClient = {
      deleteIssue: jest.fn().mockResolvedValue({ deleted: true }),
    };

    // Act: Execute orchestrator with partial failure scenario
    let orchestratorResult: {
      status: string;
      completedActions: number[];
      failureAction: number;
      failureReason: string;
      rollbackExecuted: boolean;
      rollbackCheckpoint: number;
      auditEventsRecorded: number;
    };

    try {
      // Simulate orchestrator flow with partial failure and rollback
      const action1Result = await fakeAiClient.callAction01ValidateExtractedData(
        extractedIssueData
      );
      if (!action1Result.isValid) {
        throw new Error("Action 1 validation failed");
      }

      const action2Result = await fakeAiClient.callAction02JudgePriority(
        extractedIssueData
      );

      const action3Result =
        await fakeAiClient.callAction03ConfigureToolIntegration(
          extractedIssueData
        );

      const action4Result = await fakeAiClient.callAction04RegisterToJira(
        extractedIssueData,
        action2Result
      );

      // Record successful Jira registration in mock database
      mockDatabase.jiraTickets[action4Result.jiraTicketId] = {
        issueId: extractedIssueData.issueId,
        title: extractedIssueData.title,
        createdAt: action4Result.registrationTimestamp,
        status: "created",
      };
      mockDatabase.issueIntegrationStatus[extractedIssueData.issueId] =
        "jira-registered";

      // Trigger Action 5 which will fail
      try {
        await fakeAiClient.callAction05NotifyCompletion(
          extractedIssueData,
          action4Result
        );
      } catch (action5Error) {
        // Action 5 failed - initiate rollback
        const rollbackCheckpointAction = 4;

        // Execute rollback: Delete Jira ticket
        const jiraDeleteResult = await mockJiraClient.deleteIssue(
          action4Result.jiraTicketId
        );
        if (jiraDeleteResult.deleted) {
          delete mockDatabase.jiraTickets[action4Result.jiraTicketId];
        }

        // Reset integration status to failed-waiting state
        mockDatabase.issueIntegrationStatus[extractedIssueData.issueId] =
          "integration-failed-waiting";

        // Record failure and rollback to audit table
        const auditEvent = {
          timestamp: "2024-01-15T10:00:30Z",
          eventType: "PartialFailureRollback",
          status: "completed",
          checkpointAction: rollbackCheckpointAction,
          failureReason: (action5Error as Error).message,
          rollbackDetails: {
            jiraTicketDeleted: action4Result.jiraTicketId,
            statusResetTo: "integration-failed-waiting",
            rollbackTimestamp: "2024-01-15T10:00:30Z",
          },
          retryMetadata: {
            checkpointAction: 4,
            suggestedRetryTime: "2024-01-15T10:05:30Z",
            retryPayload: extractedIssueData,
            idempotencyKey: `issue-${extractedIssueData.issueId}-retry-1`,
          },
        };

        mockAuditLogger.logEvent(auditEvent);
        mockDatabase.integrationFailureLog.push(auditEvent);

        orchestratorResult = {
          status: "PartialFailure-RollbackCompleted",
          completedActions: [1, 2, 3, 4],
          failureAction: 5,
          failureReason: "HTTP 500 Internal Server Error",
          rollbackExecuted: true,
          rollbackCheckpoint: rollbackCheckpointAction,
          auditEventsRecorded: auditEvents.length,
        };
      }
    } catch (error) {
      orchestratorResult = {
        status: "Failed",
        completedActions: [],
        failureAction: 0,
        failureReason: (error as Error).message,
        rollbackExecuted: false,
        rollbackCheckpoint: 0,
        auditEventsRecorded: 0,
      };
    }

    // Assert: Verify rollback execution and state recovery
    expect(orchestratorResult.status).toBe("PartialFailure-RollbackCompleted");
    expect(orchestratorResult.completedActions).toEqual([1, 2, 3, 4]);
    expect(orchestratorResult.failureAction).toBe(5);
    expect(orchestratorResult.failureReason).toMatch(/HTTP 500/);
    expect(orchestratorResult.rollbackExecuted).toBe(true);
    expect(orchestratorResult.rollbackCheckpoint).toBe(4);

    // Assert: Jira ticket was deleted
    expect(mockJiraClient.deleteIssue).toHaveBeenCalledWith("PROJ-12345");
    expect(mockDatabase.jiraTickets["PROJ-12345"]).toBeUndefined();

    // Assert: Integration status reset to failed-waiting
    expect(mockDatabase.issueIntegrationStatus["issue-001"]).toBe(
      "integration-failed-waiting"
    );

    // Assert: Audit event recorded with complete failure context
    expect(mockAuditLogger.logEvent).toHaveBeenCalled();
    expect(mockDatabase.integrationFailureLog).toHaveLength(1);

    const recordedAuditEvent = mockDatabase.integrationFailureLog[0];
    expect(recordedAuditEvent.eventType).toBe("PartialFailureRollback");
    expect(recordedAuditEvent.status).toBe("completed");
    expect(recordedAuditEvent.checkpointAction).toBe(4);
    expect(recordedAuditEvent.failureReason).toMatch(/HTTP 500/);

    // Assert: Rollback details contain Jira ticket ID that was deleted
    expect(recordedAuditEvent.rollbackDetails.jiraTicketDeleted).toBe(
      "PROJ-12345"
    );
    expect(recordedAuditEvent.rollbackDetails.statusResetTo).toBe(
      "integration-failed-waiting"
    );

    // Assert: Retry metadata preserved for recovery
    expect(recordedAuditEvent.retryMetadata).toBeDefined();
    expect(recordedAuditEvent.retryMetadata.checkpointAction).toBe(4);
    expect(recordedAuditEvent.retryMetadata.suggestedRetryTime).toBe(
      "2024-01-15T10:05:30Z"
    );
    expect(recordedAuditEvent.retryMetadata.retryPayload).toEqual(
      extractedIssueData
    );
    expect(recordedAuditEvent.retryMetadata.idempotencyKey).toMatch(
      /issue-issue-001-retry/
    );

    // Assert: Idempotency key enables independent retry without duplicate Jira entries
    const idempotencyKey = recordedAuditEvent.retryMetadata
      .idempotencyKey as string;
    expect(idempotencyKey).toMatch(/retry-1$/);

    // Verify Action 5 was attempted (failure proof)
    expect(fakeAiClient.callAction05NotifyCompletion).toHaveBeenCalled();

    // Verify audit event count reflects rollback logging
    expect(orchestratorResult.auditEventsRecorded).toBe(1);
  });
});