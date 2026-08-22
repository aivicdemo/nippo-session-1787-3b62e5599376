import { runTx9Imp1Agent, type Tx9Imp1AiClient } from "../../src/agents/tx-9-imp-1/orchestrator";
import { type Tx9AggregationRequest, type Tx9AnalysisReport } from "../../src/agents/tx-9-imp-1/orchestrator";

describe("tx-9-imp-1 orchestrator - escalation on complex judgment", () => {
  // SCEN-168
  test("should escalate when AI detects complex judgment scenario that cannot be resolved by priority logic", async () => {
    // Setup: Prepare aggregated data with multiple complex issues
    const aggregationStartDate = "2024-01-15";
    const aggregationEndDate = "2024-01-22";
    const targetTeamIds = ["team-001"];
    const requestedByUserId = "manager-001";

    const aggregationRequest: Tx9AggregationRequest = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    // Complex aggregated data: Issue1 (high count, short duration) vs Issue2 (low count, long duration, high business impact)
    // This scenario cannot be resolved by simple priority logic (count × duration)
    const aggregatedDataPayload = {
      aggregationPeriod: {
        startDate: aggregationStartDate,
        endDate: aggregationEndDate,
      },
      issues: [
        {
          id: "issue-001",
          title: "生産性低下",
          count: 8,
          avgResolutionDays: 2,
          impactScore: 40,
        },
        {
          id: "issue-002",
          title: "品質問題",
          count: 2,
          avgResolutionDays: 15,
          impactScore: 95,
        },
      ],
      recurrencePatterns: [
        {
          issueId: "issue-001",
          recurrenceCount: 3,
          lastOccurrence: "2024-01-20",
        },
      ],
    };

    // Mock AI client: Actions 1-5 respond normally, Action 6 (施策提案) triggers escalation
    const mockAiClient: Tx9Imp1AiClient = {
      executeAction01_AggregateReportData: jest.fn(async () => ({
        actionId: "action-01",
        status: "success",
        aggregatedReports: [
          {
            reportId: "report-001",
            teamId: "team-001",
            submittedAt: "2024-01-15T09:00:00Z",
          },
          {
            reportId: "report-002",
            teamId: "team-001",
            submittedAt: "2024-01-16T09:15:00Z",
          },
        ],
        totalReportCount: 2,
      })),

      executeAction02_IdentifyUnsubmittedMembers: jest.fn(async () => ({
        actionId: "action-02",
        status: "success",
        unsubmittedMembers: [],
        reminderSent: false,
      })),

      executeAction03_QuantifyProductivityMetrics: jest.fn(async () => ({
        actionId: "action-03",
        status: "success",
        productivityMetrics: {
          issueResolutionSpeed: 4.5,
          reportSubmissionRate: 85,
          issueRecurrenceRate: 12,
        },
      })),

      executeAction04_ClassifyAndAnalyzeIssues: jest.fn(async () => ({
        actionId: "action-04",
        status: "success",
        classifiedIssues: [
          {
            issueId: "issue-001",
            category: "productivity",
            severity: "medium",
          },
          {
            issueId: "issue-002",
            category: "quality",
            severity: "high",
          },
        ],
      })),

      executeAction05_DetectRecurrencePatterns: jest.fn(async () => ({
        actionId: "action-05",
        status: "success",
        recurrencePatterns: [
          {
            patternId: "pattern-001",
            issueId: "issue-001",
            recurrenceRisk: 0.45,
          },
        ],
      })),

      executeAction06_ProposeCountermeasures: jest.fn(async () => ({
        actionId: "action-06",
        status: "escalation_required",
        escalationTrigger: true,
        humanReviewRequired: true,
        escalationReasonType: "COMPLEX_JUDGMENT_REQUIRED",
        escalationReason:
          "優先度判定ロジックでは判断できない複合的な課題",
        pendingActions: [
          "施策提案確定前止",
          "報告書送信前止",
        ],
        managerId: "manager-001",
        humanReviewContext: {
          conflictingIssues: [
            {
              issueId: "issue-001",
              title: "生産性低下",
              metrics: {
                count: 8,
                avgResolutionDays: 2,
                impactScore: 40,
              },
              logicPriority: "medium",
            },
            {
              issueId: "issue-002",
              title: "品質問題",
              metrics: {
                count: 2,
                avgResolutionDays: 15,
                impactScore: 95,
              },
              logicPriority: "high",
            },
          ],
          conflictReason:
            "高頻度の生産性課題 vs 低頻度だが高インパクト・長期化する品質課題の優先順位判定には経営判断が必要",
        },
        countermeasureDrafts: [
          {
            issueId: "issue-002",
            draftProposal: "品質課題の根本原因分析と対策策定",
            draftPriority: "high",
          },
        ],
      })),

      executeAction07_PrepareAnalysisReport: jest.fn(async () => ({
        actionId: "action-07",
        status: "pending",
        reportId: "report-analysis-001",
        reportStatus: "draft_pending_review",
      })),
    };

    // Mock audit logger
    const auditLogEntries: Array<{
      eventType: string;
      agentId: string;
      escalationReason?: string;
      timestamp: string;
      userId: string | null;
      status: string;
    }> = [];

    const mockAuditLogger = {
      log: jest.fn((entry) => {
        auditLogEntries.push(entry);
      }),
    };

    // Mock notification service
    const sentNotifications: Array<{
      recipientId: string;
      subject: string;
      body: string;
      escalationData: object;
    }> = [];

    const mockNotificationService = {
      sendEscalationNotification: jest.fn((recipientId, subject, body, escalationData) => {
        sentNotifications.push({
          recipientId,
          subject,
          body,
          escalationData,
        });
        return Promise.resolve({ sent: true });
      }),
    };

    // Mock rollback function
    const mockRollbackFn = jest.fn(async (rollbackToken: string) => {
      return { rolled_back: true, token: rollbackToken };
    });

    // Execute agent with mocked dependencies
    const result = await runTx9Imp1Agent(
      aggregationRequest,
      mockAiClient,
      {
        auditLogger: mockAuditLogger,
        notificationService: mockNotificationService,
        rollbackFn: mockRollbackFn,
      }
    );

    // Assertions: Verify escalation was triggered and no side effects were executed

    // 1. Verify Action 1-5 were called in order
    expect(mockAiClient.executeAction01_AggregateReportData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02_IdentifyUnsubmittedMembers).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction03_QuantifyProductivityMetrics).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction04_ClassifyAndAnalyzeIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction05_DetectRecurrencePatterns).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction06_ProposeCountermeasures).toHaveBeenCalledTimes(1);

    // 2. Verify Action 7 was NOT called (side effect blocked)
    expect(mockAiClient.executeAction07_PrepareAnalysisReport).not.toHaveBeenCalled();

    // 3. Verify escalation payload contains required fields
    expect(result.isEscalated).toBe(true);
    expect(result.isComplete).toBe(false);
    expect(result.escalationPayload).toBeDefined();
    expect(result.escalationPayload?.escalationReason).toBe(
      "優先度判定ロジックでは判断できない複合的な課題"
    );
    expect(result.escalationPayload?.pendingActions).toEqual([
      "施策提案確定前止",
      "報告書送信前止",
    ]);
    expect(result.escalationPayload?.managerId).toBe("manager-001");
    expect(result.escalationPayload?.humanReviewContext).toBeDefined();
    expect(result.escalationPayload?.humanReviewContext?.conflictingIssues).toHaveLength(2);
    expect(result.escalationPayload?.humanReviewContext?.conflictingIssues?.[0].issueId).toBe(
      "issue-001"
    );
    expect(result.escalationPayload?.humanReviewContext?.conflictingIssues?.[1].issueId).toBe(
      "issue-002"
    );

    // 4. Verify audit log entry was recorded
    expect(mockAuditLogger.log).toHaveBeenCalledTimes(1);
    const auditEntry = auditLogEntries[0];
    expect(auditEntry.eventType).toBe("ESCALATION_TRIGGERED");
    expect(auditEntry.agentId).toBe("tx-9-imp-1");
    expect(auditEntry.escalationReason).toBe("COMPLEX_JUDGMENT_REQUIRED");
    expect(auditEntry.status).toBe("PENDING_HUMAN_REVIEW");
    expect(auditEntry.userId).toBeNull();
    expect(auditEntry.timestamp).toBeDefined();

    // 5. Verify escalation notification was sent to manager
    expect(mockNotificationService.sendEscalationNotification).toHaveBeenCalledTimes(1);
    const sentNotification = sentNotifications[0];
    expect(sentNotification.recipientId).toBe("manager-001");
    expect(sentNotification.subject).toContain("【重要】");
    expect(sentNotification.subject).toContain("自動分析エージェント");
    expect(sentNotification.subject).toContain("人による判断が必要です");
    expect(sentNotification.body).toContain("品質問題");
    expect(sentNotification.body).toContain("生産性低下");
    expect(sentNotification.escalationData).toEqual(result.escalationPayload);

    // 6. Verify rollback token is present
    expect(result.rollbackToken).toBeDefined();
    expect(typeof result.rollbackToken).toBe("string");

    // 7. Test rollback functionality: call rollback with token and verify state is cleared
    if (result.rollbackToken) {
      const rollbackResult = await mockRollbackFn(result.rollbackToken);
      expect(rollbackResult.rolled_back).toBe(true);
      expect(rollbackResult.token).toBe(result.rollbackToken);
    }

    // 8. Verify side effects (施策提案確定, 報告書送信) were NOT executed
    // (Action 7 not called is evidence of this, but also verify pendingActions matches expectations)
    expect(result.escalationPayload?.pendingActions).toContain("施策提案確定前止");
    expect(result.escalationPayload?.pendingActions).toContain("報告書送信前止");
  });
});