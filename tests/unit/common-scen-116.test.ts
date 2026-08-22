import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  generateWeeklyAnalysisReport,
  type WeeklyAnalysisReportInput,
  type WeeklyAnalysisReportOutput,
} from "../../src/logic/analysis-reporting";

describe("generateWeeklyAnalysisReport", () => {
  let mockAiClient: any;
  let mockAuditLog: any;
  let mockRollbackTransaction: any;

  beforeEach(() => {
    mockAuditLog = {
      events: [] as any[],
      record: function (event: any) {
        this.events.push(event);
      },
    };

    mockRollbackTransaction = {
      isRolledBack: false,
      execute: function () {
        this.isRolledBack = true;
      },
    };

    mockAiClient = {
      action01CollectPreviousWeekReports: jest.fn(),
      action02ExtractAndClassifyIssues: jest.fn(),
      action03AnalyzeTrendPatterns: jest.fn(),
      action04CalculatePriorityScores: jest.fn(),
      action05GenerateAnalysisReport: jest.fn(),
      action06ValidateAndEscalate: jest.fn(),
      action07DeliverReportToStakeholders: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-116: [error] 日報収集から分析レポート生成までの自動実行 AIエージェント - 経営判断が必要な課題が特定された場合に副作用確定前に人へ引き継ぐ
  test("should escalate to human review when executive decision required issue detected in Action 6, before side effects are committed", async () => {
    const testStartTime = new Date("2024-01-15T09:00:00Z");
    const previousWeekEndDate = new Date("2024-01-14T23:59:59Z");

    const mockReportsData = [
      {
        reportId: "rpt_001",
        memberId: "mem_001",
        reportDate: "2024-01-08",
        issuesReported: [
          {
            issueId: "iss_001",
            description: "Database performance degradation in production",
            impactScope: "critical_business_process",
            detectedAt: "2024-01-08T14:30:00Z",
          },
        ],
      },
      {
        reportId: "rpt_002",
        memberId: "mem_002",
        reportDate: "2024-01-09",
        issuesReported: [
          {
            issueId: "iss_002",
            description: "Payment gateway API timeout errors",
            impactScope: "revenue_critical",
            detectedAt: "2024-01-09T11:20:00Z",
          },
        ],
      },
      {
        reportId: "rpt_003",
        memberId: "mem_003",
        reportDate: "2024-01-10",
        issuesReported: [],
      },
      {
        reportId: "rpt_004",
        memberId: "mem_004",
        reportDate: "2024-01-11",
        issuesReported: [
          {
            issueId: "iss_003",
            description: "Customer data breach attempt detected",
            impactScope: "security_and_compliance",
            detectedAt: "2024-01-11T16:45:00Z",
          },
        ],
      },
      {
        reportId: "rpt_005",
        memberId: "mem_005",
        reportDate: "2024-01-12",
        issuesReported: [],
      },
      {
        reportId: "rpt_006",
        memberId: "mem_006",
        reportDate: "2024-01-08",
        issuesReported: [
          {
            issueId: "iss_004",
            description: "Resource exhaustion in batch processing",
            impactScope: "operational_efficiency",
            detectedAt: "2024-01-08T09:15:00Z",
          },
        ],
      },
      {
        reportId: "rpt_007",
        memberId: "mem_007",
        reportDate: "2024-01-09",
        issuesReported: [
          {
            issueId: "iss_005",
            description: "Compliance audit finding - missing documentation",
            impactScope: "regulatory_risk",
            detectedAt: "2024-01-09T13:00:00Z",
          },
        ],
      },
      {
        reportId: "rpt_008",
        memberId: "mem_008",
        reportDate: "2024-01-10",
        issuesReported: [
          {
            issueId: "iss_006",
            description: "Team productivity decline - recruitment lag",
            impactScope: "team_capacity",
            detectedAt: "2024-01-10T10:30:00Z",
          },
        ],
      },
      {
        reportId: "rpt_009",
        memberId: "mem_009",
        reportDate: "2024-01-11",
        issuesReported: [],
      },
      {
        reportId: "rpt_010",
        memberId: "mem_010",
        reportDate: "2024-01-12",
        issuesReported: [
          {
            issueId: "iss_007",
            description: "Strategic technology stack migration blocker",
            impactScope: "strategic_initiative",
            detectedAt: "2024-01-12T15:20:00Z",
          },
        ],
      },
    ];

    const action01Result = {
      collectedReportCount: 10,
      unsubmittedMemberIds: [] as string[],
      collectionCompletedAt: testStartTime.toISOString(),
      reportsPeriod: {
        startDate: "2024-01-08",
        endDate: "2024-01-14",
      },
    };

    const action02Result = {
      extractedIssuesCount: 7,
      classificationSummary: {
        critical_business_process: 1,
        revenue_critical: 1,
        security_and_compliance: 1,
        operational_efficiency: 1,
        regulatory_risk: 1,
        team_capacity: 1,
        strategic_initiative: 1,
      },
      extractionCompletedAt: testStartTime.toISOString(),
    };

    const action03Result = {
      trendPatternsIdentified: 3,
      recurrencePatterns: [
        {
          patternId: "pat_001",
          description: "Production stability issues increasing",
          affectedIssueIds: ["iss_001", "iss_002"],
          occurrenceCount: 2,
          trendDirection: "increasing",
        },
        {
          patternId: "pat_002",
          description: "Compliance and security concerns",
          affectedIssueIds: ["iss_003", "iss_005"],
          occurrenceCount: 2,
          trendDirection: "stable",
        },
        {
          patternId: "pat_003",
          description: "Strategic execution challenges",
          affectedIssueIds: ["iss_007"],
          occurrenceCount: 1,
          trendDirection: "emerging",
        },
      ],
      analysisCompletedAt: testStartTime.toISOString(),
    };

    const action04Result = {
      priorityScoringCompleted: true,
      scoredIssuesCount: 7,
      scoreDistribution: {
        high: 3,
        medium: 3,
        low: 1,
      },
      scoringCompletedAt: testStartTime.toISOString(),
      issueScores: [
        {
          issueId: "iss_001",
          priorityScore: 92,
          priorityRank: "high",
          businessImpactScore: 95,
          urgencyScore: 89,
          recurrenceRiskScore: 85,
        },
        {
          issueId: "iss_002",
          priorityScore: 88,
          priorityRank: "high",
          businessImpactScore: 94,
          urgencyScore: 86,
          recurrenceRiskScore: 78,
        },
        {
          issueId: "iss_003",
          priorityScore: 96,
          priorityRank: "high",
          businessImpactScore: 99,
          urgencyScore: 97,
          recurrenceRiskScore: 91,
        },
        {
          issueId: "iss_004",
          priorityScore: 65,
          priorityRank: "medium",
          businessImpactScore: 62,
          urgencyScore: 68,
          recurrenceRiskScore: 60,
        },
        {
          issueId: "iss_005",
          priorityScore: 78,
          priorityRank: "medium",
          businessImpactScore: 81,
          urgencyScore: 75,
          recurrenceRiskScore: 72,
        },
        {
          issueId: "iss_006",
          priorityScore: 72,
          priorityRank: "medium",
          businessImpactScore: 70,
          urgencyScore: 75,
          recurrenceRiskScore: 68,
        },
        {
          issueId: "iss_007",
          priorityScore: 45,
          priorityRank: "low",
          businessImpactScore: 52,
          urgencyScore: 38,
          recurrenceRiskScore: 40,
        },
      ],
    };

    const action05Result = {
      reportGenerationCompleted: true,
      reportContentStructure: {
        executiveSummary: {
          totalIssuesIdentified: 7,
          criticalIssuesCount: 3,
          trendSummary:
            "Production stability concerns are increasing with 2 critical issues detected",
          keyFindingsCount: 5,
        },
        detailedAnalysis: {
          issuesByPriority: {
            high: [
              {
                issueId: "iss_001",
                title: "Database performance degradation in production",
                impactScope: "critical_business_process",
                priorityScore: 92,
                rootCauseSuspection: "Unoptimized query patterns",
                recommendedAction: "Query optimization and index review",
              },
              {
                issueId: "iss_002",
                title: "Payment gateway API timeout errors",
                impactScope: "revenue_critical",
                priorityScore: 88,
                rootCauseSuspection: "Third-party API latency",
                recommendedAction: "Circuit breaker implementation",
              },
              {
                issueId: "iss_003",
                title: "Customer data breach attempt detected",
                impactScope: "security_and_compliance",
                priorityScore: 96,
                rootCauseSuspection: "Insufficient access controls",
                recommendedAction:
                  "Security audit and access control enhancement",
              },
            ],
            medium: [
              {
                issueId: "iss_004",
                title: "Resource exhaustion in batch processing",
                impactScope: "operational_efficiency",
                priorityScore: 65,
                rootCauseSuspection: "Memory leak in job scheduler",
                recommendedAction: "Memory profiling and optimization",
              },
              {
                issueId: "iss_005",
                title: "Compliance audit finding - missing documentation",
                impactScope: "regulatory_risk",
                priorityScore: 78,
                rootCauseSuspection: "Process documentation gaps",
                recommendedAction: "Documentation audit and update",
              },
              {
                issueId: "iss_006",
                title: "Team productivity decline - recruitment lag",
                impactScope: "team_capacity",
                priorityScore: 72,
                rootCauseSuspection: "Resource constraints",
                recommendedAction: "Recruitment acceleration or task reallocation",
              },
            ],
            low: [
              {
                issueId: "iss_007",
                title: "Strategic technology stack migration blocker",
                impactScope: "strategic_initiative",
                priorityScore: 45,
                rootCauseSuspection: "Dependency management complexity",
                recommendedAction: "Migration roadmap refinement",
              },
            ],
          },
          trendAnalysis: {
            patternsIdentified: 3,
            emergingConcerns: [
              "Production stability deteriorating",
              "Security posture under pressure",
            ],
          },
        },
      },
      reportGeneratedAt: testStartTime.toISOString(),
    };

    mockAiClient.action01CollectPreviousWeekReports.mockResolvedValue(
      action01Result
    );
    mockAiClient.action02ExtractAndClassifyIssues.mockResolvedValue(
      action02Result
    );
    mockAiClient.action03AnalyzeTrendPatterns.mockResolvedValue(
      action03Result
    );
    mockAiClient.action04CalculatePriorityScores.mockResolvedValue(
      action04Result
    );
    mockAiClient.action05GenerateAnalysisReport.mockResolvedValue(
      action05Result
    );

    const escalationDetectedAt = new Date("2024-01-15T09:15:00Z");
    mockAiClient.action06ValidateAndEscalate.mockResolvedValue({
      escalationConditionTriggered: true,
      escalationConditionType: "executive_decision_required",
      escalationReason:
        "Security breach attempt (iss_003) requires immediate executive decision for incident response protocol",
      triggeringIssueIds: ["iss_003"],
      escalationDetectedAt: escalationDetectedAt.toISOString(),
      executiveDecisionRequiredIssues: [
        {
          issueId: "iss_003",
          title: "Customer data breach attempt detected",
          impactScope: "security_and_compliance",
          priorityScore: 96,
          businessCriticalityLevel: "critical",
          escalationReason:
            "Potential customer data security incident requires executive oversight and legal/compliance coordination",
          recommendedExecutiveActions: [
            "Activate security incident response team",
            "Notify legal and compliance departments",
            "Prepare customer communication if breach confirmed",
          ],
          timelinessRequirement: "immediate",
        },
      ],
      shouldProceedToAction07: false,
    });

    const input: WeeklyAnalysisReportInput = {
      executionRequestId: "exec_req_116",
      reportingWeekEndDate: previousWeekEndDate.toISOString(),
      triggeringUserId: "user_director_001",
      auditLogContext: {
        sessionId: "session_116",
        requestTimestamp: testStartTime.toISOString(),
      },
      transactionControl: {
        rollbackOnEscalation: true,
      },
    };

    const result = await generateWeeklyAnalysisReport(
      input,
      mockAiClient,
      mockAuditLog,
      mockRollbackTransaction
    );

    expect(result.statusCode).toBe("ESCALATION_PENDING_HUMAN_REVIEW");
    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationCondition).toBe("executive_decision_required");
    expect(result.escalationSummary).toEqual({
      reason:
        "Security breach attempt (iss_003) requires immediate executive decision for incident response protocol",
      detectedAtAction: "action_06",
      triggeringIssueIds: ["iss_003"],
    });

    expect(result.escalationPayload).toBeDefined();
    expect(result.escalationPayload.executiveDecisionRequiredIssues).toHaveLength(
      1
    );
    expect(
      result.escalationPayload.executiveDecisionRequiredIssues[0].issueId
    ).toBe("iss_003");
    expect(
      result.escalationPayload.executiveDecisionRequiredIssues[0].title
    ).toBe("Customer data breach attempt detected");
    expect(
      result.escalationPayload.executiveDecisionRequiredIssues[0]
        .escalationReason
    ).toContain("executive oversight");
    expect(
      result.escalationPayload.executiveDecisionRequiredIssues[0]
        .recommendedExecutiveActions
    ).toHaveLength(3);

    expect(mockAiClient.action07DeliverReportToStakeholders).not.toHaveBeenCalled();

    expect(mockRollbackTransaction.isRolledBack).toBe(true);

    const escalationAuditEvent = mockAuditLog.events.find(
      (event: any) =>
        event.eventType === "escalation_initiated_at_action_06_human_decision_required"
    );
    expect(escalationAuditEvent).toBeDefined();
    expect(escalationAuditEvent.executionRequestId).toBe("exec_req_116");
    expect(escalationAuditEvent.escalationCondition).toBe(
      "executive_decision_required"
    );
    expect(escalationAuditEvent.triggeringIssueIds).toContain("iss_003");

    expect(result.stakeholderNotificationQueued).toBe(true);
    expect(result.stakeholderNotificationQueueEntry).toEqual({
      notificationType: "escalation_alert",
      targetRole: "executive_decision_maker",
      issueId: "iss_003",
      escalationLevel: "critical",
      actionRequired: true,
    });

    expect(result.reportDeliveryRolledBack).toBe(true);
    expect(result.reportDeliveryRollbackReason).toContain(
      "escalation_pending_human_review"
    );

    expect(result.actionCompletionStatus).toEqual({
      action01_collect: true,
      action02_extract_classify: true,
      action03_analyze_trends: true,
      action04_score_priorities: true,
      action05_generate_report: true,
      action06_validate_escalate: true,
      action07_deliver: false,
    });
  });
});