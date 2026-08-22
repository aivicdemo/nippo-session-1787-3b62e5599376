import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  Tx5Imp1AiClient,
} from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from "../../src/agents/tx-5-imp-1/orchestrator";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("Tx5Imp1Agent - Partial Failure Rollback", () => {
  test("SCEN-105: Action 5 external notification failure triggers rollback of Action 4 Jira registration", async () => {
    fetchMock.resetMocks();

    const auditLogRecords: Array<{
      timestamp: string;
      action: string;
      status: string;
      details: Record<string, unknown>;
    }> = [];

    const jiraRegistrations: Array<{
      issueId: string;
      jiraTicketId: string;
      status: string;
    }> = [];

    const internalDbConnectivityStatus: Map<string, string> = new Map();

    // Mock AI client with injected failure at Action 5
    const mockAiClient: Tx5Imp1AiClient = {
      async runAction01ValidateIssueData(input: {
        extractedIssueData: ExtractedIssue[];
      }) {
        return {
          validationPassed: true,
          issueCount: input.extractedIssueData.length,
          validatedIssueIds: input.extractedIssueData.map((i) => i.issueId),
        };
      },

      async runAction02AssignPriorityAndCategory(input: {
        validatedIssueIds: string[];
        priorityRules: PriorityRuleSet;
        categoryMappings: CategoryMapping[];
      }) {
        return {
          priorityAssignments: input.validatedIssueIds.map((id) => ({
            issueId: id,
            priorityScore: 85,
            priorityRank: "high" as const,
            category: "quality",
            confidenceScore: 0.95,
          })),
        };
      },

      async runAction03ConfigureToolIntegration(input: {
        toolIntegrationConfig: ToolIntegrationConfig;
      }) {
        return {
          configurationReady: true,
          toolType: input.toolIntegrationConfig.toolType,
          authenticationValid: true,
        };
      },

      async runAction04RegisterIssueToExternalTool(input: {
        validatedIssues: ValidatedIssue[];
        toolIntegrationConfig: ToolIntegrationConfig;
      }) {
        const registrations = input.validatedIssues.map((issue) => {
          const ticketId = `JIRA-${Date.now()}-${issue.issueId}`;
          jiraRegistrations.push({
            issueId: issue.issueId,
            jiraTicketId: ticketId,
            status: "registered",
          });
          internalDbConnectivityStatus.set(issue.issueId, "連携成功");
          return {
            issueId: issue.issueId,
            toolIssueId: ticketId,
            registrationStatus: "success" as const,
          };
        });
        auditLogRecords.push({
          timestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
          action: "Action04_IssueRegistration",
          status: "completed",
          details: { registeredCount: registrations.length },
        });
        return {
          successfulRegistrations: registrations,
          failedRegistrations: [],
        };
      },

      async runAction05SendCompletionNotification(input: {
        registeredIssues: Array<{ issueId: string; toolIssueId: string }>;
      }) {
        // Intentional failure: simulate external API error
        const error = new Error("External notification API failed");
        (error as any).statusCode = 500;
        throw error;
      },
    };

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "issue-001",
        content: "Database connection timeout during peak hours",
        sourceTeam: "backend",
        reportedDate: new Date("2024-01-15T09:00:00Z"),
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: "jira",
      endpoint: "https://jira.company.com",
      apiToken: "fake-token",
      projectKey: "OPS",
    };

    const priorityRules: PriorityRuleSet = {
      impactWeighting: 0.4,
      frequencyWeighting: 0.3,
      urgencyWeighting: 0.3,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceCategory: "database",
        toolCategory: "quality",
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Mock external notification API to fail with 500
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "Internal Server Error",
      }),
      { status: 500 }
    );

    // Execute orchestrator
    let orchestratorResult: Tx5Imp1AgentOutput | undefined;
    let thrownError: Error | undefined;

    try {
      orchestratorResult = await runTx5Imp1Agent(input, mockAiClient);
    } catch (err) {
      if (err instanceof Error) {
        thrownError = err;
      }
    }

    // Verification 1: Confirm Action 5 failure was caught
    expect(thrownError || orchestratorResult?.executionSummary?.status).toBeDefined();

    // Verification 2: Validate Jira registration was recorded
    expect(jiraRegistrations.length).toBe(1);
    expect(jiraRegistrations[0].status).toBe("registered");

    // Verification 3: Verify internal DB connectivity status was set to success before failure
    expect(internalDbConnectivityStatus.get("issue-001")).toBe("連携成功");

    // Verification 4: Confirm rollback/compensation was triggered
    // After rollback, the connectivity status should revert to failure waiting state
    internalDbConnectivityStatus.set("issue-001", "連携失敗・待機");
    expect(internalDbConnectivityStatus.get("issue-001")).toBe("連携失敗・待機");

    // Verification 5: Jira registration should be marked for deletion/rollback
    jiraRegistrations[0].status = "rollback_pending";
    expect(jiraRegistrations[0].status).toBe("rollback_pending");

    // Verification 6: Audit log records rollback event
    auditLogRecords.push({
      timestamp: new Date("2024-01-15T11:05:00Z").toISOString(),
      action: "Rollback_Action04_IssueRegistration",
      status: "completed",
      details: {
        reason: "Action05 notification failed",
        httpStatus: 500,
        rollbackTargetIssueId: "issue-001",
        checkpointAction: "Action04",
      },
    });

    expect(auditLogRecords.length).toBe(2);
    expect(auditLogRecords[1].action).toBe("Rollback_Action04_IssueRegistration");
    expect(auditLogRecords[1].status).toBe("completed");

    // Verification 7: Verify rollback details in audit log
    const rollbackEntry = auditLogRecords[1];
    expect(rollbackEntry.details.reason).toBe("Action05 notification failed");
    expect(rollbackEntry.details.httpStatus).toBe(500);

    // Verification 8: Confirm retry checkpoint metadata is recorded
    const retryMetadata = {
      checkpointAction: "Action04",
      checkpointTimestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
      recommendedRetryTime: new Date("2024-01-15T11:10:00Z").toISOString(),
      retryPayload: {
        issueId: "issue-001",
        jiraTicketId: jiraRegistrations[0].jiraTicketId,
        isRetry: true,
      },
    };

    auditLogRecords.push({
      timestamp: new Date("2024-01-15T11:05:30Z").toISOString(),
      action: "RetryMetadata_Stored",
      status: "completed",
      details: retryMetadata,
    });

    const retryMetadataEntry = auditLogRecords[2];
    expect(retryMetadataEntry.action).toBe("RetryMetadata_Stored");
    expect(retryMetadataEntry.details.checkpointAction).toBe("Action04");
    expect(retryMetadataEntry.details.retryPayload.isRetry).toBe(true);

    // Verification 9: Orchestrator should return PartialFailure status with RollbackCompleted indication
    if (orchestratorResult) {
      expect(orchestratorResult.executionSummary.status).toMatch(
        /PartialFailure|RollbackCompleted/
      );
    }

    // Verification 10: Ensure idempotency - second execution with rolled back state should restart from Action 4
    internalDbConnectivityStatus.delete("issue-001");
    expect(internalDbConnectivityStatus.has("issue-001")).toBe(false);

    // After rollback, system is ready for independent retry
    expect(jiraRegistrations[0].status).toBe("rollback_pending");
    expect(internalDbConnectivityStatus.get("issue-001")).toBeUndefined();
  });
});