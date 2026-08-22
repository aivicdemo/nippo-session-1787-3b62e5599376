import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";
import { type Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/types";

describe("generateWeeklyAnalysisReport", () => {
  // SCEN-117: [error] 日報収集から分析レポート生成までの自動実行 AIエージェント - 日報データの品質が基準を下回る場合
  test("should escalate and stop processing when data quality score is below threshold", async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      action01CollectWeeklyReports: jest.fn().mockResolvedValue({
        collectedReports: [
          {
            reportId: "rpt_001",
            memberId: "mem_001",
            weekStartDate: "2024-01-15",
            weekEndDate: "2024-01-21",
            tasks: ["Task A", "Task B"],
            issues: ["Issue 1"],
            achievements: ["Achievement 1"],
          },
          {
            reportId: "rpt_002",
            memberId: "mem_002",
            weekStartDate: "2024-01-15",
            weekEndDate: "2024-01-21",
            tasks: ["Task C"],
            issues: ["Issue 2"],
            achievements: ["Achievement 2"],
          },
        ],
        totalCollected: 2,
      }),
      action02SendReminders: jest.fn().mockResolvedValue({
        nonSubmitterIds: ["mem_003", "mem_004"],
        remindersSent: 2,
      }),
      action03ExtractAndClassifyIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: "issue_001",
            category: "quality",
            description: "Bug in feature X",
            severity: "high",
          },
          {
            issueId: "issue_002",
            category: "deadline",
            description: "Delay in delivery",
            severity: "medium",
          },
        ],
        totalExtracted: 2,
      }),
      action04AnalyzeTrends: jest.fn().mockResolvedValue({
        trendAnalysis: {
          qualityIssueCount: 8,
          deadlineIssueCount: 3,
          safetyIssueCount: 1,
          weekOverWeekTrend: "increasing",
          bottleneckPattern: "code_review_delay",
        },
      }),
      action05CalculatePriority: jest.fn().mockResolvedValue({
        priorityScores: [
          {
            issueId: "issue_001",
            priorityScore: 92,
            rank: 1,
          },
          {
            issueId: "issue_002",
            priorityScore: 65,
            rank: 2,
          },
        ],
      }),
      action06GenerateReport: jest.fn().mockResolvedValue({
        reportContent: "Weekly Analysis Report",
        generatedAt: "2024-01-22T10:00:00Z",
      }),
      action07DistributeReport: jest.fn().mockResolvedValue({
        distributedTo: ["manager_001"],
        distributionTimestamp: "2024-01-22T10:05:00Z",
      }),
      validateDataQuality: jest.fn().mockResolvedValue({
        qualityScore: 60,
        qualityThreshold: 75,
        isAboveThreshold: false,
      }),
    };

    const executionRecord = {
      executionId: "exec_tx6_001",
      agentId: "tx_6_imp_1",
      triggeredAt: "2024-01-22T09:00:00Z",
      status: "ESCALATION_PENDING" as const,
    };

    const escalationEvent = {
      escalationId: "esc_001",
      executionId: "exec_tx6_001",
      escalationType: "DATA_QUALITY_BELOW_THRESHOLD" as const,
      severity: "high" as const,
      recordedAt: "2024-01-22T09:15:00Z",
    };

    const handoffRecord = {
      handoffId: "hoff_001",
      executionId: "exec_tx6_001",
      escalationId: "esc_001",
      assignedToUserId: "manager_001",
      metadata: {
        qualityScore: 60,
        qualityThreshold: 75,
        dataIssueDetails: "Data quality check failed: completeness below expected standard",
      },
      createdAt: "2024-01-22T09:15:00Z",
    };

    const result = await generateWeeklyAnalysisReport(
      {
        weekStartDate: "2024-01-15",
        weekEndDate: "2024-01-21",
        triggeredByUserId: "admin_001",
      },
      mockAiClient
    );

    expect(result).toEqual({
      executionId: "exec_tx6_001",
      status: "ESCALATION_PENDING",
      escalation: {
        escalationId: "esc_001",
        escalationType: "DATA_QUALITY_BELOW_THRESHOLD",
        severity: "high",
        recordedAt: "2024-01-22T09:15:00Z",
      },
      handoff: {
        handoffId: "hoff_001",
        assignedToUserId: "manager_001",
        metadata: {
          qualityScore: 60,
          qualityThreshold: 75,
        },
      },
      reportGenerated: false,
      reportDistributed: false,
      distributionQueueLength: 0,
    });

    expect(mockAiClient.action01CollectWeeklyReports).toHaveBeenCalledWith({
      weekStartDate: "2024-01-15",
      weekEndDate: "2024-01-21",
    });

    expect(mockAiClient.action02SendReminders).toHaveBeenCalledWith({
      nonSubmitterIds: ["mem_003", "mem_004"],
    });

    expect(mockAiClient.action03ExtractAndClassifyIssues).toHaveBeenCalled();

    expect(mockAiClient.action04AnalyzeTrends).toHaveBeenCalled();

    expect(mockAiClient.validateDataQuality).toHaveBeenCalledWith({
      collectedReportCount: 2,
      extractedIssueCount: 2,
      analysisCompleteness: expect.any(Number),
    });

    expect(mockAiClient.action05CalculatePriority).not.toHaveBeenCalled();

    expect(mockAiClient.action06GenerateReport).not.toHaveBeenCalled();

    expect(mockAiClient.action07DistributeReport).not.toHaveBeenCalled();
  });
});