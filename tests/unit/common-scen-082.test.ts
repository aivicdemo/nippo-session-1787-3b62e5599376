import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-082: escalation triggered when AI priority judgment is ambiguous with confidence below threshold", async () => {
    // Setup: Mock data with ambiguous priority judgment
    const ambiguousCaseIssue = {
      issueId: "ISSUE-TX4-001",
      department: "Engineering",
      category: "Performance",
      description: "Database query optimization needed",
      importance: 7,
      urgency: 7,
      confidenceScore: 0.35,
      ambiguityFlag: true,
      alternativePatterns: [
        { priority: "HIGH", reasoning: "Affects customer SLA", confidence: 0.32 },
        { priority: "MEDIUM", reasoning: "Internal optimization only", confidence: 0.33 },
      ],
    };

    const unsubmittedMembers = [
      { userId: "USER-001", email: "member@example.com", name: "John Doe" },
      { userId: "USER-002", email: "member2@example.com", name: "Jane Smith" },
    ];

    const mockAiClient = {
      aggregateRealtimeProgress: async () => ({
        issues: [ambiguousCaseIssue],
        unsubmittedCount: 2,
        timestamp: "2024-01-15T08:30:00Z",
      }),
      extractAndRankIssues: async (issues) => ({
        rankedIssues: issues.map((issue) => ({
          ...issue,
          confidenceScore: issue.confidenceScore,
          ambiguityFlag: issue.ambiguityFlag,
        })),
      }),
      generateDashboardReport: async () => ({ status: "pending", reason: "awaiting_human_review" }),
    };

    const escalationEvents = [];
    const mockAuditLogger = {
      logEscalation: (event) => {
        escalationEvents.push(event);
      },
    };

    const mockNotificationService = {
      sendEmail: async () => ({ sent: false, reason: "escalation_pending" }),
    };

    // Execute: Call sendUnsubmittedReminder with ambiguous case scenario
    const result = await sendUnsubmittedReminder(
      unsubmittedMembers,
      mockAiClient,
      mockAuditLogger,
      mockNotificationService,
      {
        confidenceThreshold: 0.5,
        escalationRequired: true,
      }
    );

    // Verify: Escalation triggered and recorded
    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationReason).toBe("ambiguous_priority_judgment");

    // Verify: Escalation event contains required information
    expect(escalationEvents.length).toBeGreaterThan(0);
    const escalationEvent = escalationEvents[0];
    expect(escalationEvent.eventType).toBe("escalation");
    expect(escalationEvent.reason).toBe("ambiguous_priority_judgment");
    expect(escalationEvent.actor).toBe("ai_agent_tx4_imp1");
    expect(escalationEvent.timestamp).toBeDefined();
    expect(escalationEvent.details).toBeDefined();
    expect(escalationEvent.details.issueId).toBe("ISSUE-TX4-001");
    expect(escalationEvent.details.confidenceScore).toBe(0.35);
    expect(escalationEvent.details.alternativePatterns).toEqual([
      { priority: "HIGH", reasoning: "Affects customer SLA", confidence: 0.32 },
      { priority: "MEDIUM", reasoning: "Internal optimization only", confidence: 0.33 },
    ]);
    expect(escalationEvent.details.judgedConfidenceIsBelowThreshold).toBe(true);

    // Verify: Side effects (email send, dashboard confirmation) not executed
    expect(result.dashboardReportStatus).toBe("pending");
    expect(result.dashboardReportReason).toBe("awaiting_human_review");
    expect(result.emailsSent).toBe(0);

    // Verify: Dashboard material remains in "confirmed awaiting" state, not sent
    expect(result.materialConfirmed).toBe(false);
    expect(result.briefingConfirmed).toBe(false);

    // Verify: Human escalation info prepared for review
    expect(result.escalationInfo).toBeDefined();
    expect(result.escalationInfo.requiresHumanReview).toBe(true);
    expect(result.escalationInfo.issueDetails).toBeDefined();
    expect(result.escalationInfo.issueDetails.issueId).toBe("ISSUE-TX4-001");
  });
});