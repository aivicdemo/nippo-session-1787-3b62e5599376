import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  Tx5Imp1AiClient,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from "../../src/agents/tx-5-imp-1/orchestrator";

describe("TX-5-IMP-1: Idempotent Issue Extraction and Tool Integration", () => {
  let mockDb: Map<string, { writeCount: number; notificationCount: number }>;
  let notificationCallLog: Array<{ timestamp: string; issueId: string }>;
  let jiraApiCallLog: Array<{ action: string; issueId: string }>;

  beforeEach(() => {
    mockDb = new Map();
    notificationCallLog = [];
    jiraApiCallLog = [];

    mockDb.set("ISSUE-001", {
      writeCount: 0,
      notificationCount: 0,
    });
  });

  afterEach(() => {
    mockDb.clear();
    notificationCallLog = [];
    jiraApiCallLog = [];
  });

  // SCEN-3159
  test("should maintain idempotency across multiple executions of same issue data", async () => {
    const extractedIssueData = [
      {
        issueId: "ISSUE-001",
        title: "Database connection timeout",
        description: "Connection pool exhaustion in production",
        severity: "high" as const,
        affectedSystems: ["auth-service", "api-gateway"],
      },
    ];

    const toolIntegrationConfig = {
      toolType: "jira" as const,
      endpoint: "https://jira.example.com/api",
      projectKey: "PROJ",
      apiToken: "fake-token-xyz",
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    const categoryMappings = [
      {
        source: "high",
        target: "P0-Critical",
        jiraCategory: "機能不具合",
      },
    ];

    const mockAiClient: Tx5Imp1AiClient = {
      action01_validateIssueFormat: async () => {
        mockDb.get("ISSUE-001")!.writeCount += 1;
        return {
          isValid: true,
          issues: [
            {
              issueId: "ISSUE-001",
              validationStatus: "valid" as const,
              errors: [],
            },
          ],
        };
      },

      action02_judgeIssueCategory: async () => {
        return {
          judgments: [
            {
              issueId: "ISSUE-001",
              category: "機能不具合",
              confidence: 0.95,
            },
          ],
        };
      },

      action03_configureTool: async () => {
        return {
          configurationId: "CONFIG-001",
          toolType: "jira" as const,
          isReady: true,
        };
      },

      action04_registerToExternalTool: async () => {
        jiraApiCallLog.push({
          action: "create_or_update",
          issueId: "ISSUE-001",
        });
        return {
          successCount: 1,
          failureCount: 0,
          registeredIssues: [
            {
              originalId: "ISSUE-001",
              toolIssueId: "JIRA-12345",
            },
          ],
        };
      },

      action05_recordAndNotify: async () => {
        notificationCallLog.push({
          timestamp: "2024-01-15T10:30:00Z",
          issueId: "ISSUE-001",
        });
        mockDb.get("ISSUE-001")!.notificationCount += 1;
        return {
          notificationsSent: 1,
          statusRecorded: true,
        };
      },
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const firstExecutionOutput: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      input,
      mockAiClient
    );

    expect(firstExecutionOutput.validatedIssues).toHaveLength(1);
    expect(firstExecutionOutput.validatedIssues[0]).toEqual(
      expect.objectContaining({
        issueId: "ISSUE-001",
        validationStatus: "valid",
        toolIssueId: "JIRA-12345",
      })
    );
    expect(firstExecutionOutput.integrationResult).toEqual(
      expect.objectContaining({
        successCount: 1,
        failureCount: 0,
      })
    );
    expect(firstExecutionOutput.executionSummary).toEqual(
      expect.objectContaining({
        status: "success",
      })
    );

    const dbStateAfterFirstExecution = mockDb.get("ISSUE-001")!;
    expect(dbStateAfterFirstExecution.writeCount).toBe(1);
    expect(dbStateAfterFirstExecution.notificationCount).toBe(1);
    expect(notificationCallLog).toHaveLength(1);
    expect(jiraApiCallLog).toHaveLength(1);

    notificationCallLog = [];
    jiraApiCallLog = [];

    const secondExecutionOutput: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      input,
      mockAiClient
    );

    expect(secondExecutionOutput.validatedIssues).toHaveLength(1);
    expect(secondExecutionOutput.validatedIssues[0]).toEqual(
      expect.objectContaining({
        issueId: "ISSUE-001",
        validationStatus: "valid",
        toolIssueId: "JIRA-12345",
      })
    );

    const dbStateAfterSecondExecution = mockDb.get("ISSUE-001")!;
    expect(dbStateAfterSecondExecution.writeCount).toBe(1);
    expect(dbStateAfterSecondExecution.notificationCount).toBe(1);

    expect(notificationCallLog).toHaveLength(0);

    expect(jiraApiCallLog).toHaveLength(0);
  });
});