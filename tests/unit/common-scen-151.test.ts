import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-151: escalation condition detected before side effect commit triggers human handoff with audit log", async () => {
    // Setup: Create mock AI client that simulates tx8_imp_1 escalation scenario
    const mockAiClient = {
      action01_searchAndExtractIssueData: jest.fn().mockResolvedValue({
        issues: [
          {
            id: "issue_001",
            title: "Production database connection timeout",
            severity: "critical",
            reportedDate: "2024-01-15T09:00:00Z",
          },
          {
            id: "issue_002",
            title: "API response delay",
            severity: "high",
            reportedDate: "2024-01-15T09:30:00Z",
          },
        ],
        extractedAt: "2024-01-15T10:00:00Z",
      }),
      action02_analyzeRecurrencePatterns: jest.fn().mockResolvedValue({
        patterns: [
          {
            patternId: "pattern_001",
            baseIssueId: "issue_001",
            recurrenceCount: 3,
            timeSeriesData: [
              {
                date: "2024-01-10",
                occurrences: 1,
              },
              {
                date: "2024-01-12",
                occurrences: 1,
              },
              {
                date: "2024-01-15",
                occurrences: 1,
              },
            ],
          },
        ],
        analysisTimestamp: "2024-01-15T10:05:00Z",
      }),
      action03_identifyBottleneckPatterns: jest.fn().mockResolvedValue({
        bottlenecks: [
          {
            bottleneckId: "bn_001",
            description: "Database connection pooling exhaustion",
            impactLevel: "critical",
            affectedIssues: ["issue_001"],
          },
        ],
        identifiedAt: "2024-01-15T10:10:00Z",
      }),
      action04_generateVisualizationReport: jest.fn().mockResolvedValue({
        reportId: "report_20240115_001",
        reportContent: {
          title: "Issue Pattern Analysis Report",
          generatedAt: "2024-01-15T10:15:00Z",
          sections: [
            {
              sectionType: "timeline",
              data: "timeline_chart_data",
            },
            {
              sectionType: "bottleneck",
              data: "bottleneck_visualization",
            },
          ],
        },
        reportStatus: "pending_distribution",
      }),
      action05_prepareEscalationHandoff: jest.fn().mockResolvedValue({
        escalationDetected: true,
        escalationCondition: "urgent_issue_identified",
        escalationDetails: {
          criticalIssueCount: 1,
          highPriorityIssueCount: 1,
          requiresImmediateAction: true,
          recommendedActions: [
            "Immediate database team notification",
            "Incident severity escalation",
          ],
        },
        handoffStatus: "pending_human_review",
        handoffTimestamp: "2024-01-15T10:20:00Z",
      }),
    };

    // Setup: Mock audit log collection
    const auditLogEntries: Array<{
      timestamp: string;
      eventType: string;
      escalationReason?: string;
      handoffTarget?: string;
    }> = [];

    const mockAuditLogger = {
      recordEscalationDetection: jest.fn((timestamp, reason, target) => {
        auditLogEntries.push({
          timestamp,
          eventType: "escalation_detected",
          escalationReason: reason,
          handoffTarget: target,
        });
      }),
    };

    // Setup: Mock notification service for handoff notification
    const handoffNotifications: Array<{
      recipientId: string;
      messageType: string;
      content: string;
      timestamp: string;
    }> = [];

    const mockNotificationService = {
      sendHandoffNotification: jest.fn(
        (recipientId, messageType, content, timestamp) => {
          handoffNotifications.push({
            recipientId,
            messageType,
            content,
            timestamp,
          });
          return Promise.resolve({ notificationId: "notif_001", sent: true });
        }
      ),
    };

    // Setup: Mock side effect tracking
    const sideEffectCommitLog: Array<{
      type: string;
      status: string;
      timestamp: string;
    }> = [];

    const mockSideEffectTracker = {
      recordAttempt: jest.fn((type, status, timestamp) => {
        sideEffectCommitLog.push({
          type,
          status,
          timestamp,
        });
      }),
    };

    // Test parameter: Unsubmitted member reminder input with escalation scenario context
    const reminderInput = {
      unsubmittedMemberIds: ["member_001", "member_002"],
      reportingDeadline: "2024-01-15T11:00:00Z",
      escalationContext: {
        agentExecutionId: "tx8_imp_1_exec_20240115",
        currentActionNumber: 5,
        hasEscalationDetected: true,
        escalationConditionType: "urgent_issue_identified",
      },
      departmentManagerId: "manager_dept_001",
      auditLogger: mockAuditLogger,
      notificationService: mockNotificationService,
      sideEffectTracker: mockSideEffectTracker,
    };

    // Execution: Call sendUnsubmittedReminder which should detect escalation
    // and trigger handoff before side effect commitment
    const result = await sendUnsubmittedReminder(reminderInput);

    // Assertion 1: Escalation condition was detected and handoff status is set to pending_human_review
    expect(result.status).toBe("escalation_handoff_initiated");
    expect(result.handoffStatus).toBe("pending_human_review");
    expect(result.escalationDetected).toBe(true);

    // Assertion 2: Side effect (reminder distribution) was not committed
    // Verify that reminder notifications to unsubmitted members were NOT sent
    const reminderDistributionAttempts = sideEffectCommitLog.filter(
      (log) => log.type === "reminder_distribution"
    );
    expect(reminderDistributionAttempts.length).toBe(0);

    // Assertion 3: Handoff notification to department manager WAS sent
    expect(handoffNotifications.length).toBeGreaterThan(0);
    const managerHandoffNotif = handoffNotifications.find(
      (notif) => notif.recipientId === "manager_dept_001"
    );
    expect(managerHandoffNotif).toBeDefined();
    expect(managerHandoffNotif?.messageType).toBe("escalation_handoff");
    expect(managerHandoffNotif?.content).toContain("urgent_issue_identified");
    expect(managerHandoffNotif?.content).toContain("pending_human_review");

    // Assertion 4: Audit log recorded escalation detection with correct metadata
    expect(auditLogEntries.length).toBeGreaterThan(0);
    const escalationAuditEntry = auditLogEntries.find(
      (entry) => entry.eventType === "escalation_detected"
    );
    expect(escalationAuditEntry).toBeDefined();
    expect(escalationAuditEntry?.escalationReason).toBe(
      "urgent_issue_identified"
    );
    expect(escalationAuditEntry?.handoffTarget).toBe("manager_dept_001");
    expect(escalationAuditEntry?.timestamp).toBeDefined();

    // Assertion 5: Escalation timestamp is ISO 8601 format and recent
    const auditTimestamp = new Date(escalationAuditEntry!.timestamp);
    expect(auditTimestamp.getTime()).toBeGreaterThan(
      new Date("2024-01-15T10:00:00Z").getTime()
    );
    expect(auditTimestamp.getTime()).toBeLessThanOrEqual(
      new Date("2024-01-15T11:00:00Z").getTime()
    );

    // Assertion 6: Handoff context is properly maintained for human review
    expect(result.handoffContext).toBeDefined();
    expect(result.handoffContext?.criticalIssueDetails).toBeDefined();
    expect(result.handoffContext?.analysisDetails).toBeDefined();
    expect(result.handoffContext?.confirmationRequired).toBe(true);

    // Assertion 7: Verify that auto-proposal and auto-distribution side effects
    // are marked as "pending_commit" and not executed
    const autoProposalAttempts = sideEffectCommitLog.filter(
      (log) =>
        log.type === "auto_proposal" && log.status === "pending_commit"
    );
    expect(autoProposalAttempts.length).toBeGreaterThan(0);

    const autoDistributionAttempts = sideEffectCommitLog.filter(
      (log) =>
        log.type === "auto_report_distribution" &&
        log.status === "pending_commit"
    );
    expect(autoDistributionAttempts.length).toBeGreaterThan(0);

    // Assertion 8: Handoff notification contains escalation analysis details
    expect(managerHandoffNotif?.content).toContain(
      "critical"
    );
    expect(managerHandoffNotif?.content).toMatch(
      /requires immediate action|recommendation/i
    );
  });
});