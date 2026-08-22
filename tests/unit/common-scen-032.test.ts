import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  Tx1Imp1AiClient,
  PrioritizedIssue,
} from "../../src/agents/tx-1-imp-1/orchestrator";

describe("Tx1Imp1Agent Escalation: Unknown Priority Rule Type", () => {
  let mockAiClient: jest.Mocked<Tx1Imp1AiClient>;
  let mockLogger: jest.Mock;
  let mockEmailService: jest.Mock;

  beforeEach(() => {
    mockLogger = jest.fn();
    mockEmailService = jest.fn().mockResolvedValue({ success: true });

    mockAiClient = {
      action01_CollectSubmissionStatus: jest
        .fn()
        .mockResolvedValue({
          submittedCount: 8,
          unsubmittedMemberIds: ["M003", "M007"],
        }),

      action02_SendUnsubmittedNotification: jest
        .fn()
        .mockResolvedValue({
          notificationsSent: 2,
          failedMemberIds: [],
        }),

      action03_ExtractAndClassifyIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: "ISS-001",
            title: "Database connection timeout",
            category: "performance",
            description:
              "Connection pool exhausted during peak hours, response time exceeded SLA",
          },
          {
            issueId: "ISS-002",
            title: "Novel stakeholder escalation protocol required",
            category: "unknown_governance_type",
            description:
              "New governance framework needed for cross-organizational decisions - type not in known rules",
          },
          {
            issueId: "ISS-003",
            title: "API rate limiting",
            category: "reliability",
            description: "Third-party API rate limit exceeded",
          },
        ],
      }),

      action04_AssignPriorityScore: jest.fn().mockImplementation(async (input) => {
        const issuesWithUndefinedType = input.issues.filter(
          (issue: { category?: string }) =>
            issue.category === "unknown_governance_type"
        );

        if (issuesWithUndefinedType.length > 0) {
          const escalationError = new Error(
            "ESCALATION_UNKNOWN_PRIORITY_RULE_TYPE"
          );
          Object.assign(escalationError, {
            escalationCondition: "unknown_priority_rule_type",
            unknownIssueTypes: issuesWithUndefinedType.map(
              (issue: { issueId?: string; category?: string; title?: string }) => ({
                issueId: issue.issueId,
                category: issue.category,
                title: issue.title,
              })
            ),
            knownRuleCategories: [
              "performance",
              "reliability",
              "security",
              "documentation",
            ],
            timestamp: new Date("2024-01-15T09:00:00Z").toISOString(),
          });
          throw escalationError;
        }

        return {
          prioritizedIssues: input.issues.map(
            (
              issue: { issueId?: string; title?: string; description?: string },
              index: number
            ) => ({
              issueId: issue.issueId,
              title: issue.title,
              priority: index === 0 ? "high" : index === 1 ? "medium" : "low",
              priorityScore: 8.5 - index * 2,
              reasoning: `Standard prioritization applied for ${issue.title}`,
            })
          ),
        };
      }),

      action05_GenerateMorningMeetingMaterial: jest
        .fn()
        .mockResolvedValue({
          reportId: "REPORT-001",
          generatedAt: new Date("2024-01-15T09:15:00Z").toISOString(),
          materialUrl: "/reports/morning-meeting-001.html",
        }),

      action06_SendCompletionNotification: jest
        .fn()
        .mockResolvedValue({
          notificationSent: true,
          deliveryTimestamp: new Date("2024-01-15T09:20:00Z").toISOString(),
        }),
    };
  });

  test("SCEN-032: escalation triggered when unknown priority rule type detected in action 4", async () => {
    const executionInput: Tx1Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      reportDeadlineTime: "09:00",
      morningMeetingStartTime: "09:30",
      teamMemberIds: [
        "M001",
        "M002",
        "M003",
        "M004",
        "M005",
        "M006",
        "M007",
        "M008",
        "M009",
        "M010",
      ],
      managerEmail: "manager@example.com",
    };

    const escalationNotifications: Array<{
      condition: string;
      unknownTypes: Array<{ issueId: string; category: string; title: string }>;
      timestamp: string;
      requiresManualReview: boolean;
    }> = [];

    const executionLog: Array<{
      step: string;
      status: string;
      timestamp: string;
      details?: object;
    }> = [];

    mockAiClient.action04_AssignPriorityScore = jest
      .fn()
      .mockImplementation(async (input) => {
        const issuesWithUndefinedType = input.issues.filter(
          (issue: { category?: string }) =>
            issue.category === "unknown_governance_type"
        );

        if (issuesWithUndefinedType.length > 0) {
          const unknownCategoriesDetected = issuesWithUndefinedType.map(
            (issue: {
              issueId?: string;
              category?: string;
              title?: string;
            }) => ({
              issueId: issue.issueId,
              category: issue.category,
              title: issue.title,
            })
          );

          executionLog.push({
            step: "action04_assign_priority_score",
            status: "escalation_detected",
            timestamp: new Date("2024-01-15T09:05:00Z").toISOString(),
            details: {
              escalationCondition: "unknown_priority_rule_type",
              unknownIssueCount: unknownCategoriesDetected.length,
            },
          });

          escalationNotifications.push({
            condition: "unknown_priority_rule_type",
            unknownTypes: unknownCategoriesDetected,
            timestamp: new Date("2024-01-15T09:05:00Z").toISOString(),
            requiresManualReview: true,
          });

          const escalationError = new Error(
            "ESCALATION_UNKNOWN_PRIORITY_RULE_TYPE"
          );
          Object.assign(escalationError, {
            escalationCondition: "unknown_priority_rule_type",
            unknownIssueTypes: unknownCategoriesDetected,
            knownRuleCategories: [
              "performance",
              "reliability",
              "security",
              "documentation",
            ],
            timestamp: new Date("2024-01-15T09:05:00Z").toISOString(),
          });
          throw escalationError;
        }

        return {
          prioritizedIssues: input.issues.map(
            (
              issue: { issueId?: string; title?: string },
              index: number
            ) => ({
              issueId: issue.issueId,
              title: issue.title,
              priority: index === 0 ? "high" : "medium",
              priorityScore: 8.5 - index * 2,
              reasoning: `Prioritization for ${issue.title}`,
            })
          ),
        };
      });

    let thrownError: Error | null = null;
    let agentOutput: Tx1Imp1AgentOutput | null = null;

    try {
      agentOutput = await runTx1Imp1Agent(executionInput, mockAiClient);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/ESCALATION_UNKNOWN_PRIORITY_RULE_TYPE/);

    const escalationErrorDetails = thrownError as any;
    expect(escalationErrorDetails.escalationCondition).toBe(
      "unknown_priority_rule_type"
    );
    expect(escalationErrorDetails.unknownIssueTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueId: "ISS-002",
          category: "unknown_governance_type",
        }),
      ])
    );

    expect(escalationErrorDetails.unknownIssueTypes).toHaveLength(1);
    expect(escalationErrorDetails.unknownIssueTypes[0]).toEqual({
      issueId: "ISS-002",
      category: "unknown_governance_type",
      title: "Novel stakeholder escalation protocol required",
    });

    expect(escalationErrorDetails.knownRuleCategories).toEqual([
      "performance",
      "reliability",
      "security",
      "documentation",
    ]);

    expect(escalationErrorDetails.timestamp).toBe(
      "2024-01-15T09:05:00Z"
    );

    expect(escalationNotifications).toHaveLength(1);
    expect(escalationNotifications[0].condition).toBe(
      "unknown_priority_rule_type"
    );
    expect(escalationNotifications[0].unknownTypes).toHaveLength(1);
    expect(escalationNotifications[0].unknownTypes[0].issueId).toBe("ISS-002");
    expect(escalationNotifications[0].requiresManualReview).toBe(true);

    expect(mockAiClient.action05_GenerateMorningMeetingMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.action06_SendCompletionNotification).not.toHaveBeenCalled();

    expect(executionLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step: "action04_assign_priority_score",
          status: "escalation_detected",
        }),
      ])
    );

    const escalationLogEntry = executionLog.find(
      (entry) => entry.status === "escalation_detected"
    );
    expect(escalationLogEntry).toBeDefined();
    expect(escalationLogEntry?.details).toEqual({
      escalationCondition: "unknown_priority_rule_type",
      unknownIssueCount: 1,
    });

    expect(agentOutput).toBeNull();

    expect(mockAiClient.action01_CollectSubmissionStatus).toHaveBeenCalled();
    expect(mockAiClient.action02_SendUnsubmittedNotification).toHaveBeenCalled();
    expect(mockAiClient.action03_ExtractAndClassifyIssues).toHaveBeenCalled();
    expect(mockAiClient.action04_AssignPriorityScore).toHaveBeenCalled();
  });
});