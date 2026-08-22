import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
} from "../../src/agents/tx-5-imp-1/types";
import type { Tx5Imp1AiClient } from "../../src/agents/tx-5-imp-1/ai-client";
import type {
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from "../../src/agents/tx-5-imp-1/types";
import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";

describe("Tx5Imp1Agent - Escalation on Tool Integration Failure", () => {
  let mockAiClient: jest.Mocked<Tx5Imp1AiClient>;
  let auditLogs: Array<{
    timestamp: string;
    eventType: string;
    escalationReason?: string;
    notificationRecipientId?: string;
    issueIds?: string[];
    errorDetails?: string;
  }>;
  let sentNotifications: Array<{
    recipientId: string;
    subject: string;
    content: string;
    issueIds: string[];
    escalationReason: string;
    recommendedAction: string;
  }>;

  beforeEach(() => {
    auditLogs = [];
    sentNotifications = [];

    mockAiClient = {
      executeAction01ValidateExtractedIssueData: jest
        .fn()
        .mockResolvedValue({
          isValid: true,
          validatedIssues: [
            {
              issueId: "issue-001",
              priorityScore: 85,
              priorityRank: "high",
              category: "defect",
              toolIssueId: null,
              validationStatus: "valid",
            },
            {
              issueId: "issue-002",
              priorityScore: 60,
              priorityRank: "medium",
              category: "enhancement",
              toolIssueId: null,
              validationStatus: "valid",
            },
          ],
        }),

      executeAction02DeterminePriorityAndCategory: jest
        .fn()
        .mockResolvedValue({
          issuesWithPriority: [
            {
              issueId: "issue-001",
              priorityScore: 85,
              priorityRank: "high",
              category: "defect",
              toolIssueId: null,
              validationStatus: "valid",
            },
            {
              issueId: "issue-002",
              priorityScore: 60,
              priorityRank: "medium",
              category: "enhancement",
              toolIssueId: null,
              validationStatus: "valid",
            },
          ],
        }),

      executeAction03ExecuteToolIntegrationConfig: jest
        .fn()
        .mockResolvedValue({
          success: false,
          errorCode: "INTEGRATION_FAILED",
          errorMessage:
            "Failed to establish connection with Jira API. Authentication failed.",
          failedIssueIds: ["issue-001", "issue-002"],
          registeredIssueIds: [],
          attemptedToolName: "Jira",
        }),

      executeAction04RegisterIssuesToExternalTool: jest.fn(),
      executeAction05RecordStatusAndNotify: jest.fn(),
    } as unknown as jest.Mocked<Tx5Imp1AiClient>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-098
  test("should escalate to human and send notification when tool integration fails before confirming side effects", async () => {
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "issue-001",
        description: "Critical bug in payment processing",
        impact: "high",
        frequency: "recurring",
      },
      {
        issueId: "issue-002",
        description: "Enhancement request for user dashboard",
        impact: "medium",
        frequency: "one-time",
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolName: "Jira",
      apiEndpoint: "https://jira.example.com/api/v3",
      apiKey: "test-api-key",
      projectKey: "PROJ",
    };

    const priorityRules: PriorityRuleSet = {
      highImpactWeight: 0.6,
      frequencyWeight: 0.4,
      thresholdHigh: 70,
      thresholdMedium: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      { sourceCategory: "defect", targetCategory: "bug", toolName: "Jira" },
      {
        sourceCategory: "enhancement",
        targetCategory: "story",
        toolName: "Jira",
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Mock notification system to capture sent notifications
    const mockSendNotification = jest
      .fn()
      .mockImplementation(
        (
          recipientId: string,
          subject: string,
          content: string,
          issueIds: string[],
          escalationReason: string,
          recommendedAction: string
        ) => {
          sentNotifications.push({
            recipientId,
            subject,
            content,
            issueIds,
            escalationReason,
            recommendedAction,
          });
          return Promise.resolve();
        }
      );

    // Mock audit log recording
    const mockRecordAuditLog = jest
      .fn()
      .mockImplementation(
        (
          eventType: string,
          escalationReason?: string,
          notificationRecipientId?: string,
          issueIds?: string[],
          errorDetails?: string
        ) => {
          auditLogs.push({
            timestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
            eventType,
            escalationReason,
            notificationRecipientId,
            issueIds,
            errorDetails,
          });
          return Promise.resolve();
        }
      );

    // Execute orchestrator with mocked AI client
    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient, {
      sendNotification: mockSendNotification,
      recordAuditLog: mockRecordAuditLog,
    });

    // Assertion 1: Action 1 execution confirmed
    expect(mockAiClient.executeAction01ValidateExtractedIssueData).toHaveBeenCalledWith(
      extractedIssueData
    );
    expect(mockAiClient.executeAction01ValidateExtractedIssueData).toHaveBeenCalledTimes(1);

    // Assertion 2: Action 2 execution confirmed
    expect(mockAiClient.executeAction02DeterminePriorityAndCategory).toHaveBeenCalled();
    expect(mockAiClient.executeAction02DeterminePriorityAndCategory).toHaveBeenCalledTimes(1);

    // Assertion 3: Action 3 execution confirmed (tool integration config execution)
    expect(mockAiClient.executeAction03ExecuteToolIntegrationConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: "Jira",
        apiEndpoint: "https://jira.example.com/api/v3",
      })
    );
    expect(mockAiClient.executeAction03ExecuteToolIntegrationConfig).toHaveBeenCalledTimes(1);

    // Assertion 4: Tool integration result status is error
    expect(output.integrationResult.success).toBe(false);
    expect(output.integrationResult.errorCode).toBe("INTEGRATION_FAILED");
    expect(output.integrationResult.errorMessage).toMatch(/Failed to establish connection/);

    // Assertion 5: Escalation condition "existing tool integration failed" is met
    expect(output.integrationResult.success).toBe(false);
    expect(output.integrationResult.failedIssueIds).toEqual(
      expect.arrayContaining(["issue-001", "issue-002"])
    );

    // Assertion 6: Escalation was triggered and notification sent before side effects confirmed
    expect(mockSendNotification).toHaveBeenCalled();
    expect(mockSendNotification).toHaveBeenCalledTimes(1);

    const notificationCall = sentNotifications[0];
    expect(notificationCall).toBeDefined();
    expect(notificationCall.recipientId).toBeTruthy();
    expect(notificationCall.subject).toMatch(/escalation|integration|failed/i);

    // Assertion 7: Notification content contains required information
    expect(notificationCall.issueIds).toEqual(
      expect.arrayContaining(["issue-001", "issue-002"])
    );
    expect(notificationCall.escalationReason).toBe("既存ツール連携に失敗した");
    expect(notificationCall.recommendedAction).toMatch(/人による連携設定の確認が必要/);
    expect(notificationCall.content).toMatch(/issue-001/);
    expect(notificationCall.content).toMatch(/INTEGRATION_FAILED/);

    // Assertion 8: Action 4 (register to external tool) was NOT executed (side effect not confirmed)
    expect(mockAiClient.executeAction04RegisterIssuesToExternalTool).not.toHaveBeenCalled();

    // Assertion 9: Action 5 (record status and notify) was NOT executed (side effect not confirmed)
    expect(mockAiClient.executeAction05RecordStatusAndNotify).not.toHaveBeenCalled();

    // Assertion 10: Tool registration status remains "pending" or "unregistered"
    expect(output.validatedIssues).toBeDefined();
    expect(output.validatedIssues).toHaveLength(2);
    output.validatedIssues.forEach((issue: ValidatedIssue) => {
      expect(issue.toolIssueId).toBeNull();
      expect(issue.validationStatus).not.toBe("registered");
    });

    // Assertion 11: Audit log recorded EscalationTriggered event
    expect(mockRecordAuditLog).toHaveBeenCalled();
    expect(auditLogs).toHaveLength(1);

    const auditLog = auditLogs[0];
    expect(auditLog.eventType).toBe("EscalationTriggered");
    expect(auditLog.escalationReason).toBe("既存ツール連携に失敗した");
    expect(auditLog.notificationRecipientId).toBeTruthy();
    expect(auditLog.issueIds).toEqual(
      expect.arrayContaining(["issue-001", "issue-002"])
    );
    expect(auditLog.errorDetails).toMatch(/INTEGRATION_FAILED/);
    expect(auditLog.timestamp).toBe("2024-01-15T11:00:00Z");

    // Assertion 12: Execution summary reflects escalation state
    expect(output.executionSummary).toBeDefined();
    expect(output.executionSummary.finalStatus).toBe("escalated");
    expect(output.executionSummary.escalationReason).toBe("既存ツール連携に失敗した");
  });
});