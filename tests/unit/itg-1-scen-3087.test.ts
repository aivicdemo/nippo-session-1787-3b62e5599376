import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  Tx1Imp1AiClient,
} from "../../src/agents/tx-1-imp-1/orchestrator";

describe("TX-1-IMP-1 AIエージェント: 重大インシデント検出時のエスカレーション処理", () => {
  // SCEN-3087
  test("重大インシデント報告の即時エスカレーション検出時に副作用確定前に人へ引き継ぐ", async () => {
    // ========== Setup: Test Fixtures ==========
    const executionTimestamp = new Date("2024-01-15T09:00:00Z");
    const reportDeadlineTime = new Date("2024-01-15T09:30:00Z");
    const morningMeetingStartTime = new Date("2024-01-15T10:00:00Z");
    const targetTeamIds = ["team-001"];
    const managerUserId = "manager-001";

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId,
    };

    // ========== Setup: Mock Report Data ==========
    const criticalReportRecord = {
      reportId: "D001",
      userId: "user-A",
      issueText:
        "本番システムAで認証サービスが完全停止。全ユーザーアクセス不可。重大インシデント",
      severity: "UNCLASSIFIED",
      timestamp: new Date("2024-01-15T09:00:00Z"),
    };

    // ========== Setup: Mock AI Client with Escalation Detection ==========
    const mockAiClient: Tx1Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "重大インシデント", frequency: 1 },
          { keyword: "認証サービス停止", frequency: 1 },
        ],
      }),

      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "HIGH",
        confidence: 0.98,
      }),

      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 95,
        rationale: "本番認証サービス完全停止による全体影響",
      }),

      determinePriority: jest.fn().mockResolvedValue({
        escalationFlag: true,
        escalationType: "CRITICAL_INCIDENT",
        requiresHumanReview: true,
        escalationReason: "重大インシデント検出",
        priorityScore: 100,
      }),

      generateMorningBriefing: jest.fn(),
      sendCompletionNotification: jest.fn(),
    };

    // ========== Setup: Mock Notification Service ==========
    const mockNotificationAdapter = {
      sendEscalationAlert: jest
        .fn()
        .mockResolvedValue({ notificationId: "esc-alert-001" }),
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // ========== Setup: Mock Text Analysis Service ==========
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // ========== Execution: Call Agent with Mocks ==========
    const output = await runTx1Imp1Agent(input, mockAiClient, {
      notificationAdapter: mockNotificationAdapter,
      textAnalysisAdapter: mockTextAnalysisAdapter,
    });

    // ========== Assertion 1: Escalation Status ==========
    expect(output.executionStatus).toBe("escalation_hold");

    // ========== Assertion 2: Escalation ID Present ==========
    expect(output.escalationId).toBeDefined();
    expect(typeof output.escalationId).toBe("string");
    expect(output.escalationId.length).toBeGreaterThan(0);

    // ========== Assertion 3: Next Action Awaiting Review ==========
    expect(output.nextAction).toBe("AWAITING_HUMAN_REVIEW");

    // ========== Assertion 4: Affected Actions Listed ==========
    expect(output.affectedActions).toBeDefined();
    expect(Array.isArray(output.affectedActions)).toBe(true);
    expect(output.affectedActions).toContain("Action-05");
    expect(output.affectedActions).toContain("Action-06");

    // ========== Assertion 5: AI Client Methods Called Correctly ==========
    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.classifyIssueSeverity).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScore).toHaveBeenCalled();
    expect(mockAiClient.determinePriority).toHaveBeenCalled();

    // ========== Assertion 6: Critical Briefing NOT Generated ==========
    expect(mockAiClient.generateMorningBriefing).not.toHaveBeenCalled();

    // ========== Assertion 7: Escalation Alert Sent to Manager ==========
    expect(mockNotificationAdapter.sendEscalationAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: managerUserId,
        alertType: "CRITICAL_INCIDENT_ESCALATION",
        reportId: "D001",
        reason: expect.stringContaining("重大インシデント"),
        actionRequired: "人的確認と判断を要求",
      })
    );

    // ========== Assertion 8: Auto Reminders NOT Sent ==========
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // ========== Assertion 9: Completion Notification NOT Sent ==========
    expect(mockAiClient.sendCompletionNotification).not.toHaveBeenCalled();

    // ========== Assertion 10: Morning Briefing URL Not Present ==========
    expect(output.morningMeetingMaterialUrl).toBeUndefined();

    // ========== Assertion 11: Escalation Metadata Correct ==========
    expect(output.escalationType).toBe("CRITICAL_INCIDENT");
    expect(output.requiresHumanReview).toBe(true);

    // ========== Assertion 12: Execution Timestamp Set ==========
    expect(output.executionTimestamp).toBeDefined();
    expect(output.executionTimestamp instanceof Date).toBe(true);

    // ========== Assertion 13: Report Aggregation Summary Not Populated ==========
    expect(output.reportAggregationSummary).toBeUndefined();

    // ========== Assertion 14: Prioritized Issues List Not Present ==========
    expect(output.prioritizedIssuesList).toBeUndefined();

    // ========== Assertion 15: Unsubmitted Members Notification Not Sent ==========
    expect(output.unsubmittedMembersNotified).toBe(false);
  });
});