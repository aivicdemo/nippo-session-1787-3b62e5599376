import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import { type Tx5Imp1AiClient } from "../../src/agents/tx-5-imp-1/orchestrator";
import { type Tx5Imp1AgentInput, type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from "../../src/agents/tx-5-imp-1/orchestrator";

describe("Tx5Imp1Agent - Issue Extraction and Tool Integration", () => {
  // SCEN-099
  test("should escalate to human review when encountering unknown category before executing tool integration side effects", async () => {
    // Arrange: Initialize fake AI client
    const auditLogEntries: Array<{ eventType: string; timestamp: string; reason?: string }> = [];

    const fakeAiClient: Tx5Imp1AiClient = {
      async executeAction01ValidateExtractedIssueData() {
        return {
          isValid: true,
          validationErrors: [],
          processedCount: 1,
        };
      },

      async executeAction02DeterminePriorityAndCategory() {
        return {
          priorityScore: 85,
          category: "SecurityVulnerabilityScanning",
          isUnknownCategory: true,
          confidence: 0.35,
        };
      },

      async executeAction03ExecuteToolIntegrationSettings() {
        throw new Error("Should not be called - escalation should occur first");
      },

      async executeAction04CompleteJiraAsanaRegistration() {
        throw new Error("Should not be called - escalation should occur first");
      },

      async executeAction05RecordIntegrationCompletionStatusAndNotify() {
        throw new Error("Should not be called - escalation should occur first");
      },

      async escapeToHumanReview(payload: {
        reason: string;
        escalationTrigger: string;
        extractedIssueId: string;
        unknownCategoryName: string;
        priorityScore: number;
        confidenceScore: number;
      }) {
        auditLogEntries.push({
          eventType: "ESCALATION_TRIGGERED",
          timestamp: new Date().toISOString(),
          reason: payload.reason,
        });
        return {
          escalationAcknowledged: true,
          assignedToReviewerId: "human-reviewer-001",
          reviewDeadline: new Date("2024-12-31T23:59:59Z").toISOString(),
        };
      },
    };

    // Prepare stub for tool integration success (should not be called)
    const jiraApiCallTracker: Array<{ method: string; args: unknown }> = [];
    const asanaApiCallTracker: Array<{ method: string; args: unknown }> = [];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      jiraApiEndpoint: "https://jira.example.com/api/v3",
      asanaApiEndpoint: "https://app.asana.com/api/1.0",
      jiraProjectKey: "TEST",
      asanaProjectId: "987654321",
      syncBothTools: true,
      retryOnFailure: true,
    };

    const priorityRules: PriorityRuleSet = {
      highImpactThreshold: 80,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      recalculateOnNewPattern: true,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        issueSystemCategory: "Performance",
        externalToolCategory: "Performance",
        priority: "medium",
      },
      {
        issueSystemCategory: "Availability",
        externalToolCategory: "Availability",
        priority: "high",
      },
    ];

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: "issue-sec-001",
        title: "Security Vulnerability Scanning Process",
        description:
          "New security vulnerability scanning process needs categorization and tool integration",
        extractedAt: new Date("2024-12-15T10:00:00Z").toISOString(),
        source: "morning-report",
        keywordsDetected: ["security", "vulnerability", "scanning"],
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Act: Run the agent
    const result = await runTx5Imp1Agent(input, fakeAiClient);

    // Assert: Verify escalation occurred before tool integration
    expect(result.validatedIssues).toHaveLength(0);
    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.toolIssueIds).toEqual([]);

    expect(jiraApiCallTracker).toHaveLength(0);
    expect(asanaApiCallTracker).toHaveLength(0);

    expect(result.executionSummary.status).toBe("escalated");
    expect(result.executionSummary.escalationReason).toContain(
      "SecurityVulnerabilityScanning"
    );

    expect(auditLogEntries).toHaveLength(1);
    expect(auditLogEntries[0].eventType).toBe("ESCALATION_TRIGGERED");
    expect(auditLogEntries[0].reason).toContain("unknown category");
    expect(auditLogEntries[0].reason).toContain(
      "SecurityVulnerabilityScanning"
    );
  });
});