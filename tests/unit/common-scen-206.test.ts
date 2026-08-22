import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  let mockAiClient: any;
  let escalationQueue: any[];
  let auditLog: any[];
  let notificationQueue: any[];

  beforeEach(() => {
    escalationQueue = [];
    auditLog = [];
    notificationQueue = [];

    mockAiClient = {
      action01_detectUnsubmitted: jest.fn(),
      action02_decideCataloguing: jest.fn(),
      action03_extractIssue: jest.fn(),
      action04_suggestReference: jest.fn(),
      action05_assignPriority: jest.fn(),
      action06_broadcastSummary: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-206: [error] 日報収集・確認・催促の自動化エージェント AIエージェント - 不正・曖昧・低確信度のAI出力を拒否して安全に引き継ぐ
  test("should detect malformed AI output and escalate to director without executing business actions", async () => {
    const unsubmittedMembers = [
      {
        memberId: "M001",
        memberName: "Alice",
        lastSubmissionDate: new Date("2024-01-14T09:00:00Z"),
      },
      {
        memberId: "M002",
        memberName: "Bob",
        lastSubmissionDate: new Date("2024-01-13T09:00:00Z"),
      },
    ];

    const reportData = [
      {
        reportId: "R001",
        memberId: "M001",
        content: "System outage in production",
        submittedAt: new Date("2024-01-15T08:00:00Z"),
      },
    ];

    const reminderDeadline = new Date("2024-01-15T11:00:00Z");

    // Action 2: Confidence score outside valid range [0, 1]
    mockAiClient.action02_decideCataloguing.mockResolvedValue({
      shouldSendReminder: true,
      confidenceScore: 1.5, // INVALID: exceeds maximum of 1
      reason: "member overdue",
    });

    // Action 3: Unstructured text instead of parsed issues
    mockAiClient.action03_extractIssue.mockResolvedValue(
      "some unstructured text response without JSON structure" // INVALID: not structured
    );

    // Action 4: Logically unrelated reference
    mockAiClient.action04_suggestReference.mockResolvedValue({
      referencedIssueId: "ISSUE-999",
      referenceReason: "similar",
      confidence: 0.1, // Weak connection
      pastIssueDetails: {
        title: "Unrelated office supply order",
        resolution: "ordered supplies",
      },
    });

    // Action 5: Priority score outside valid range [1, 5]
    mockAiClient.action05_assignPriority.mockResolvedValue({
      priorityScore: 150, // INVALID: exceeds maximum of 5
      severityScore: -5, // INVALID: below minimum of 1
      reasoning: "high impact issue",
    });

    const contextData = {
      directorId: "D001",
      teamId: "T001",
      dateTime: new Date("2024-01-15T09:30:00Z"),
      escalationCallback: (record: any) => {
        escalationQueue.push(record);
      },
      auditLogCallback: (record: any) => {
        auditLog.push(record);
      },
      notificationCallback: (record: any) => {
        notificationQueue.push(record);
      },
    };

    await sendUnsubmittedReminder(
      {
        unsubmittedMembers,
        reportData,
        reminderDeadline,
      },
      mockAiClient,
      contextData
    );

    // Verify Action 2 output rejected due to invalid confidence score
    expect(auditLog).toContainEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
        targetAction: "action02_decideCataloguing",
        invalidOutput: { confidenceScore: 1.5 },
        detectionReason: "confidence score outside valid range [0, 1]",
        escalationDecision: true,
        directorNotificationFlag: true,
      })
    );

    // Verify Action 3 output rejected due to unstructured response
    expect(auditLog).toContainEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
        targetAction: "action03_extractIssue",
        invalidOutput: "some unstructured text response without JSON structure",
        detectionReason: "response is not valid structured JSON",
        escalationDecision: true,
        directorNotificationFlag: true,
      })
    );

    // Verify Action 4 reference skipped due to weak logical connection
    expect(auditLog).toContainEqual(
      expect.objectContaining({
        targetAction: "action04_suggestReference",
        detectionReason: "reference relevance unverifiable",
        escalationDecision: false,
      })
    );

    // Verify Action 5 output rejected due to invalid priority score
    expect(auditLog).toContainEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
        targetAction: "action05_assignPriority",
        invalidOutput: { priorityScore: 150, severityScore: -5 },
        detectionReason:
          "priority score outside valid range [1, 5], severity score outside valid range [1, 5]",
        escalationDecision: true,
        directorNotificationFlag: true,
      })
    );

    // Verify escalation queue contains flagged members
    expect(escalationQueue.length).toBeGreaterThan(0);
    expect(escalationQueue).toContainEqual(
      expect.objectContaining({
        escalationType: "ai_output_invalid",
        classification: "confidence_insufficient_or_structure_malformed_or_score_out_of_range",
        requiredReview: "director_final_decision",
        timestamp: expect.any(String),
      })
    );

    // Verify NO actual reminder notifications were sent
    const actualRemindersSent = notificationQueue.filter(
      (n) => n.type === "reminder"
    );
    expect(actualRemindersSent).toHaveLength(0);

    // Verify director notification queued for AI output issues
    const directorNotifications = notificationQueue.filter(
      (n) => n.recipientId === "D001"
    );
    expect(directorNotifications).toContainEqual(
      expect.objectContaining({
        recipientId: "D001",
        messageType: "ai_output_validation_failure",
        content: expect.stringContaining(
          "AI output trust verification failed"
        ),
        requiresManualReview: true,
      })
    );

    // Verify report system state unchanged
    expect(reportData).toHaveLength(1);
    expect(reportData[0].submittedAt).toEqual(
      new Date("2024-01-15T08:00:00Z")
    );
  });
});