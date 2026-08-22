import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from "../../src/agents/tx-11-imp-1/prompts/action-05";
import type { Tx11AgentInput, Tx11AgentOutput, SubmissionStatusSummary, PrioritizedIssue, NotificationRecord } from "../../src/agents/tx-11-imp-1/types";
import type { Tx11Imp1AiClient } from "../../src/agents/tx-11-imp-1/orchestrator";

describe("TX11 Agent - Action 5 Prioritization and Summary Generation", () => {
  let mockAiClient: jest.Mocked<Tx11Imp1AiClient>;
  let auditLog: Array<{ timestamp: Date; event: string; details: Record<string, unknown> }>;

  beforeEach(() => {
    auditLog = [];

    mockAiClient = {
      callAction01GetSubmissionStatus: jest.fn(),
      callAction02SendNotifications: jest.fn(),
      callAction03ExtractIssues: jest.fn(),
      callAction04ClassifyIssues: jest.fn(),
      callAction05PrioritizeAndSummarize: jest.fn(),
      callAction06SendManagerSummary: jest.fn(),
      recordAuditLog: jest.fn((event: string, details: Record<string, unknown>) => {
        auditLog.push({
          timestamp: new Date(),
          event,
          details
        });
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-199
  test("should execute Action 5 prioritization and create prioritized summary with audit trail", async () => {
    // Setup: 10 members dataset with issues
    const executionTimestamp = new Date("2024-01-15T07:00:00Z");
    const teamId = "TEAM-001";
    const reportDeadlineTime = "09:00";
    const managerEmail = "manager@example.com";

    const agentInput: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail
    };

    // Mock Action 1: Submission status
    const submissionStatus: SubmissionStatusSummary = {
      totalMembers: 10,
      submittedCount: 8,
      unsubmittedMembers: ["MEMBER-009", "MEMBER-010"]
    };

    mockAiClient.callAction01GetSubmissionStatus.mockResolvedValue(submissionStatus);

    // Mock Action 2: Notifications sent
    const notificationsRecord: NotificationRecord[] = [
      {
        memberId: "MEMBER-009",
        email: "member009@example.com",
        notificationType: "reminder",
        sentAt: executionTimestamp,
        status: "sent"
      },
      {
        memberId: "MEMBER-010",
        email: "member010@example.com",
        notificationType: "reminder",
        sentAt: executionTimestamp,
        status: "sent"
      }
    ];

    mockAiClient.callAction02SendNotifications.mockResolvedValue(notificationsRecord);

    // Mock Action 3: Extract issues from submitted reports
    const extractedIssues = [
      { issueId: "ISS-001", content: "Database performance degradation", severity: "high", mentionCount: 3, memberIds: ["MEMBER-001", "MEMBER-002", "MEMBER-003"] },
      { issueId: "ISS-002", content: "API timeout errors on production", severity: "high", mentionCount: 2, memberIds: ["MEMBER-004", "MEMBER-005"] },
      { issueId: "ISS-003", content: "Memory leak in cache layer", severity: "medium", mentionCount: 2, memberIds: ["MEMBER-006", "MEMBER-007"] },
      { issueId: "ISS-004", content: "Documentation outdated for new API", severity: "low", mentionCount: 1, memberIds: ["MEMBER-008"] },
      { issueId: "ISS-005", content: "Build pipeline timeout issues", severity: "medium", mentionCount: 1, memberIds: ["MEMBER-001"] }
    ];

    mockAiClient.callAction03ExtractIssues.mockResolvedValue(extractedIssues);

    // Mock Action 4: Classify issues
    const classifiedIssues = extractedIssues.map(issue => ({
      ...issue,
      category: issue.severity === "high" ? "infrastructure" : issue.severity === "medium" ? "development" : "documentation",
      recurrenceRiskScore: issue.severity === "high" ? 0.8 : 0.5,
      affectedMemberCount: issue.memberIds.length
    }));

    mockAiClient.callAction04ClassifyIssues.mockResolvedValue(classifiedIssues);

    // Mock Action 5: Prioritize and summarize
    const prioritizedIssues: PrioritizedIssue[] = [
      {
        issueId: "ISS-001",
        content: "Database performance degradation",
        priorityScore: 95,
        severityLevel: "high",
        estimatedResponseTimeMinutes: 30,
        affectedMemberCount: 3,
        recurrenceRiskLevel: "critical",
        recommendedAction: "Immediate investigation and performance tuning required"
      },
      {
        issueId: "ISS-002",
        content: "API timeout errors on production",
        priorityScore: 88,
        severityLevel: "high",
        estimatedResponseTimeMinutes: 45,
        affectedMemberCount: 2,
        recurrenceRiskLevel: "high",
        recommendedAction: "Review API load balancing and timeout configurations"
      },
      {
        issueId: "ISS-003",
        content: "Memory leak in cache layer",
        priorityScore: 72,
        severityLevel: "medium",
        estimatedResponseTimeMinutes: 60,
        affectedMemberCount: 2,
        recurrenceRiskLevel: "medium",
        recommendedAction: "Code review and memory profiling of cache implementation"
      },
      {
        issueId: "ISS-005",
        content: "Build pipeline timeout issues",
        priorityScore: 58,
        severityLevel: "medium",
        estimatedResponseTimeMinutes: 45,
        affectedMemberCount: 1,
        recurrenceRiskLevel: "medium",
        recommendedAction: "Optimize build scripts and increase timeout thresholds"
      },
      {
        issueId: "ISS-004",
        content: "Documentation outdated for new API",
        priorityScore: 35,
        severityLevel: "low",
        estimatedResponseTimeMinutes: 20,
        affectedMemberCount: 1,
        recurrenceRiskLevel: "low",
        recommendedAction: "Schedule documentation update in backlog"
      }
    ];

    mockAiClient.callAction05PrioritizeAndSummarize.mockResolvedValue(prioritizedIssues);

    // Mock Action 6: Send summary to manager
    mockAiClient.callAction06SendManagerSummary.mockResolvedValue(true);

    // Verify buildAction05Prompt is exported and callable
    expect(typeof buildAction05Prompt).toBe("function");
    expect(typeof ACTION_05_PROMPT_VERSION).toBe("string");
    expect(ACTION_05_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);

    // Build Action 5 prompt with sample data
    const action05Prompt = buildAction05Prompt({
      extractedIssues: classifiedIssues,
      totalMembers: 10,
      submittedCount: 8,
      deadlineTime: reportDeadlineTime,
      priorityRules: {
        highSeverityWeight: 0.5,
        frequencyWeight: 0.3,
        impactWeight: 0.2
      }
    });

    expect(action05Prompt).toContain("優先度");
    expect(action05Prompt).toContain("課題");
    expect(action05Prompt).toContain("サマリー");

    // Execute agent with mock client
    const result: Tx11AgentOutput = await runTx11Imp1Agent(agentInput, mockAiClient);

    // Verify Action 1 was called
    expect(mockAiClient.callAction01GetSubmissionStatus).toHaveBeenCalledWith({
      executionTimestamp,
      teamId,
      deadlineTime: reportDeadlineTime
    });

    // Verify Action 2 was called with unsubmitted members
    expect(mockAiClient.callAction02SendNotifications).toHaveBeenCalledWith({
      unsubmittedMembers: ["MEMBER-009", "MEMBER-010"],
      executionTimestamp,
      teamId
    });

    // Verify Action 3 was called
    expect(mockAiClient.callAction03ExtractIssues).toHaveBeenCalled();

    // Verify Action 4 was called
    expect(mockAiClient.callAction04ClassifyIssues).toHaveBeenCalled();

    // Verify Action 5 input contains required prioritization data
    expect(mockAiClient.callAction05PrioritizeAndSummarize).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssues: expect.any(Array),
        totalMembers: 10,
        submittedCount: 8,
        priorityRules: expect.any(Object)
      })
    );

    // Verify Action 6 (send manager summary) was called
    expect(mockAiClient.callAction06SendManagerSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        managerEmail,
        prioritizedIssues: expect.any(Array)
      })
    );

    // Verify output structure
    expect(result).toHaveProperty("submissionStatus");
    expect(result).toHaveProperty("prioritizedIssues");
    expect(result).toHaveProperty("notificationsSent");
    expect(result).toHaveProperty("summaryEmailSent");

    // Verify submission status
    expect(result.submissionStatus.totalMembers).toBe(10);
    expect(result.submissionStatus.submittedCount).toBe(8);
    expect(result.submissionStatus.unsubmittedMembers).toEqual(["MEMBER-009", "MEMBER-010"]);

    // Verify prioritized issues are sorted by priority score descending
    expect(result.prioritizedIssues).toHaveLength(5);
    expect(result.prioritizedIssues[0].priorityScore).toBe(95);
    expect(result.prioritizedIssues[0].issueId).toBe("ISS-001");
    expect(result.prioritizedIssues[1].priorityScore).toBe(88);
    expect(result.prioritizedIssues[1].issueId).toBe("ISS-002");
    expect(result.prioritizedIssues[2].priorityScore).toBe(72);
    expect(result.prioritizedIssues[3].priorityScore).toBe(58);
    expect(result.prioritizedIssues[4].priorityScore).toBe(35);

    // Verify each prioritized issue has required fields
    result.prioritizedIssues.forEach(issue => {
      expect(issue).toHaveProperty("issueId");
      expect(issue).toHaveProperty("content");
      expect(issue).toHaveProperty("priorityScore");
      expect(typeof issue.priorityScore).toBe("number");
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(issue).toHaveProperty("severityLevel");
      expect(["high", "medium", "low"]).toContain(issue.severityLevel);
      expect(issue).toHaveProperty("estimatedResponseTimeMinutes");
      expect(typeof issue.estimatedResponseTimeMinutes).toBe("number");
      expect(issue.estimatedResponseTimeMinutes).toBeGreaterThan(0);
      expect(issue).toHaveProperty("affectedMemberCount");
      expect(typeof issue.affectedMemberCount).toBe("number");
      expect(issue).toHaveProperty("recurrenceRiskLevel");
      expect(["critical", "high", "medium", "low"]).toContain(issue.recurrenceRiskLevel);
    });

    // Verify notifications were recorded
    expect(result.notificationsSent).toHaveLength(2);
    expect(result.notificationsSent[0].memberId).toBe("MEMBER-009");
    expect(result.notificationsSent[0].status).toBe("sent");
    expect(result.notificationsSent[1].memberId).toBe("MEMBER-010");
    expect(result.notificationsSent[1].status).toBe("sent");

    // Verify summary email was sent (not sent to members, only to manager)
    expect(result.summaryEmailSent).toBe(true);

    // Verify audit logs were recorded
    expect(auditLog.length).toBeGreaterThan(0);
    const action05AuditLogs = auditLog.filter(log => log.event.includes("action-05") || log.event.includes("prioritize"));
    expect(action05AuditLogs.length).toBeGreaterThan(0);

    // Verify audit log entries contain timestamps
    auditLog.forEach(log => {
      expect(log.timestamp).toBeInstanceOf(Date);
      expect(log.event).toBeTruthy();
      expect(typeof log.details).toBe("object");
    });

    // Verify prompt version is consistent
    const promptVersionMatch = action05Prompt.match(/version[:\s]+(\d+\.\d+\.\d+)/i);
    if (promptVersionMatch) {
      expect(promptVersionMatch[1]).toMatch(/^\d+\.\d+\.\d+$/);
    }

    // Verify no automatic notifications sent to members for prioritization
    // (only submission reminders sent in Action 2, not prioritization summaries)
    expect(result.notificationsSent.every(n => n.notificationType === "reminder")).toBe(true);
  });
});