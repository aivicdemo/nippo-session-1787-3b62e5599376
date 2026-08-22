import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";
import type { Tx9Imp1AiClient } from "../../src/agents/tx-9-imp-1/orchestrator";

describe("generateWeeklyAnalysisReport", () => {
  let mockDb: {
    auditLogs: Array<{
      eventType: string;
      agentId: string;
      escalationReason: string;
      timestamp: string;
      userId: string | null;
      status: string;
    }>;
    pendingEscalations: Array<{
      escalationId: string;
      escalationReason: string;
      humanReviewRequired: boolean;
      status: string;
    }>;
  };

  let mockNotificationService: {
    sendEmail: jest.Mock;
  };

  let mockAiClient: Tx9Imp1AiClient;

  beforeEach(() => {
    mockDb = {
      auditLogs: [],
      pendingEscalations: [],
    };

    mockNotificationService = {
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    mockAiClient = {
      action01_aggregateReportData: jest
        .fn()
        .mockResolvedValue({
          aggregationType: "success",
          reportCount: 5,
          periodStart: "2024-01-08",
          periodEnd: "2024-01-14",
        }),

      action02_identifyUnsubmittedMembers: jest
        .fn()
        .mockResolvedValue({
          unsubmittedMembers: [],
          totalMembers: 5,
          submissionRate: 1.0,
        }),

      action03_quantifyProductivityMetrics: jest
        .fn()
        .mockResolvedValue({
          metricsType: "success",
          issueCount: 2,
          avgResolutionDays: 3.5,
          responseRatePercent: 92,
        }),

      action04_analyzePrioritiesAndIssues: jest
        .fn()
        .mockResolvedValue({
          analysisType: "success",
          highPriorityIssues: [
            {
              issueId: "issue_001",
              title: "生産性低下",
              occurrenceCount: 8,
              resolutionDays: 1,
              businessImpact: "medium",
              category: "productivity",
            },
          ],
          mediumPriorityIssues: [
            {
              issueId: "issue_002",
              title: "品質問題",
              occurrenceCount: 2,
              resolutionDays: 6,
              businessImpact: "high",
              category: "quality",
            },
          ],
        }),

      action05_detectRecurrencePatterns: jest
        .fn()
        .mockResolvedValue({
          patternDetectionType: "success",
          recurrenceCount: 1,
          criticalPatterns: [],
        }),

      action06_proposeRemediationStrategies: jest
        .fn()
        .mockResolvedValue({
          escalationTrigger: true,
          escalationReasonType: "COMPLEX_JUDGMENT_REQUIRED",
          humanReviewRequired: true,
          escalationReason:
            "優先度判定ロジックでは判断できない複合的な課題",
          pendingActions: ["施策提案確定前止", "報告書送信前止"],
          managerId: "manager_001",
          humanReviewContext: {
            complexIssues: [
              {
                issueId: "issue_001",
                title: "生産性低下",
                occurrenceCount: 8,
                resolutionDays: 1,
                businessImpact: "medium",
              },
              {
                issueId: "issue_002",
                title: "品質問題",
                occurrenceCount: 2,
                resolutionDays: 6,
                businessImpact: "high",
              },
            ],
            conflictingPriorities:
              "issue_001は件数多だが解決期間短、issue_002は件数少だが解決期間長かつ経営影響大",
          },
          rollbackToken: "token_escalation_20240114_001",
        }),

      action07_compileAndDistributeReport: jest
        .fn()
        .mockResolvedValue({
          reportCompilationType: "skipped_due_to_escalation",
          distributionStatus: "not_sent",
        }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-168
  test("should escalate to human review when escalation conditions are met and suspend side effects", async () => {
    const aggregatedData = {
      periodStart: "2024-01-08",
      periodEnd: "2024-01-14",
      reportCount: 5,
      unsubmittedCount: 0,
      issues: [
        {
          issueId: "issue_001",
          title: "生産性低下",
          occurrenceCount: 8,
          resolutionDays: 1,
          businessImpact: "medium",
          category: "productivity",
        },
        {
          issueId: "issue_002",
          title: "品質問題",
          occurrenceCount: 2,
          resolutionDays: 6,
          businessImpact: "high",
          category: "quality",
        },
      ],
    };

    const result = await generateWeeklyAnalysisReport(
      aggregatedData,
      mockAiClient,
      {
        dbConnection: mockDb,
        notificationService: mockNotificationService,
        agentId: "tx-9-imp-1",
        userId: null,
      }
    );

    expect(result.isComplete).toBe(false);
    expect(result.isEscalated).toBe(true);

    expect(result.escalationPayload).toBeDefined();
    expect(result.escalationPayload?.escalationReason).toBe(
      "優先度判定ロジックでは判断できない複合的な課題"
    );
    expect(result.escalationPayload?.pendingActions).toEqual([
      "施策提案確定前止",
      "報告書送信前止",
    ]);
    expect(result.escalationPayload?.managerId).toBe("manager_001");
    expect(result.escalationPayload?.humanReviewContext).toBeDefined();
    expect(
      result.escalationPayload?.humanReviewContext.complexIssues
    ).toHaveLength(2);

    expect(mockDb.auditLogs).toContainEqual(
      expect.objectContaining({
        eventType: "ESCALATION_TRIGGERED",
        agentId: "tx-9-imp-1",
        escalationReason: "COMPLEX_JUDGMENT_REQUIRED",
        userId: null,
        status: "PENDING_HUMAN_REVIEW",
      })
    );

    expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "manager_001",
        subject: expect.stringMatching(/【重要】自動分析エージェント/),
        body: expect.stringMatching(/複合課題|人による判断/),
      })
    );

    expect(result.rollbackToken).toBe("token_escalation_20240114_001");

    expect(mockAiClient.action07_compileAndDistributeReport).not.toHaveBeenCalled();
  });
});