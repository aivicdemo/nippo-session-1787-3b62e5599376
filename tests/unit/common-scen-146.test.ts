import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("Analysis Reporting - generateWeeklyAnalysisReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-146: [normal] 課題検索から可視化レポート作成までの自動実行 AIエージェント
  test("should execute complete autonomous workflow from issue search to visualization report with bottleneck pattern identification", async () => {
    // Arrange: Mock data for Action 1 - Issue Search & Extraction
    const mockIssueDataset = [
      {
        issueId: "ISSUE-001",
        reportDate: "2024-01-08",
        category: "quality",
        severity: 8,
        description: "Database connection timeout in process A",
      },
      {
        issueId: "ISSUE-002",
        reportDate: "2024-01-09",
        category: "performance",
        severity: 6,
        description: "API response delay in process A",
      },
      {
        issueId: "ISSUE-003",
        reportDate: "2024-01-10",
        category: "quality",
        severity: 7,
        description: "Deployment failure in process B",
      },
      {
        issueId: "ISSUE-004",
        reportDate: "2024-01-11",
        category: "quality",
        severity: 9,
        description: "Database connection timeout in process A",
      },
      {
        issueId: "ISSUE-005",
        reportDate: "2024-01-12",
        category: "schedule",
        severity: 5,
        description: "Task delay in process C",
      },
    ];

    // Mock data for Action 2 - Recurrence Pattern Analysis
    const mockRecurrencePatterns = [
      {
        patternId: "PATTERN-001",
        patternType: "same_cause_recurrence",
        issueIds: ["ISSUE-001", "ISSUE-004"],
        rootCause: "Database connection pool exhaustion",
        frequency: 2,
      },
      {
        patternId: "PATTERN-002",
        patternType: "environment_dependent_recurrence",
        issueIds: ["ISSUE-003"],
        rootCause: "Deployment process configuration mismatch",
        frequency: 1,
      },
    ];

    // Mock data for Action 3 - Bottleneck Pattern Identification
    const mockBottleneckPatterns = [
      {
        bottleneckId: "BN-001",
        periodShift: "processA_to_processB",
        timeRange: {
          from: "2024-01-08",
          to: "2024-01-12",
        },
        affectedProcesses: ["A", "B"],
        impactScore: 7.5,
        patternDescription: "Shift from process A bottleneck to process B bottleneck",
      },
    ];

    // Mock data for Action 4 - Visualization Report Generation
    const mockReportMetadata = {
      reportId: "RPT-001",
      generatedAt: "2024-01-15T09:00:00Z",
      timeSeriesData: [
        { timestamp: "2024-01-08", bottleneckProcess: "A", issueCount: 1 },
        { timestamp: "2024-01-09", bottleneckProcess: "A", issueCount: 1 },
        { timestamp: "2024-01-10", bottleneckProcess: "B", issueCount: 1 },
        { timestamp: "2024-01-11", bottleneckProcess: "A", issueCount: 1 },
        { timestamp: "2024-01-12", bottleneckProcess: "C", issueCount: 1 },
      ],
      graphCoordinates: [
        { x: 0, y: 8 },
        { x: 1, y: 6 },
        { x: 2, y: 7 },
        { x: 3, y: 9 },
        { x: 4, y: 5 },
      ],
    };

    // Mock data for Action 5 - High Priority Issue Extraction
    const mockPriorityExtraction = {
      priorityScores: [
        { issueId: "ISSUE-001", score: 85 },
        { issueId: "ISSUE-004", score: 90 },
        { issueId: "ISSUE-003", score: 80 },
      ],
      highlightedIssueIds: ["ISSUE-004", "ISSUE-001"],
      highPriorityThreshold: 75,
    };

    const action1Prompt = {
      version: "1.0.0",
      query: "Extract issues from last 7 days",
    };

    const action2Prompt = {
      version: "1.0.0",
      issues: mockIssueDataset,
    };

    const action3Prompt = {
      version: "1.0.0",
      patterns: mockRecurrencePatterns,
    };

    const action4Prompt = {
      version: "1.0.0",
      bottlenecks: mockBottleneckPatterns,
    };

    const action5Prompt = {
      version: "1.0.0",
      report: mockReportMetadata,
    };

    const mockAiClient = {
      callAction: jest
        .fn()
        .mockResolvedValueOnce(mockIssueDataset)
        .mockResolvedValueOnce(mockRecurrencePatterns)
        .mockResolvedValueOnce(mockBottleneckPatterns)
        .mockResolvedValueOnce(mockReportMetadata)
        .mockResolvedValueOnce(mockPriorityExtraction),
    };

    // Act: Execute the orchestrator with mocked AI client
    const result = await generateWeeklyAnalysisReport(mockAiClient, {
      startDate: "2024-01-08",
      endDate: "2024-01-12",
      teamId: "TEAM-001",
    });

    // Assert: Verify Action 1 execution - Issue Search & Extraction
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(result.executionId).toMatch(/^EXE-/);

    // Assert: Verify Issue dataset
    expect(result.issueDataset).toBeDefined();
    expect(result.issueDataset).toHaveLength(5);
    expect(result.issueDataset[0]).toHaveProperty("issueId");
    expect(result.issueDataset[0]).toHaveProperty("reportDate");
    expect(result.issueDataset[0]).toHaveProperty("severity");

    // Assert: Verify Action 2 execution - Recurrence Pattern Analysis
    expect(result.recurrencePatterns).toBeDefined();
    expect(result.recurrencePatterns).toHaveLength(2);
    expect(result.recurrencePatterns[0]).toHaveProperty("patternId");
    expect(result.recurrencePatterns[0]).toHaveProperty("patternType");
    expect(result.recurrencePatterns[0].frequency).toBe(2);
    expect(result.recurrencePatterns[1].patternType).toBe(
      "environment_dependent_recurrence"
    );

    // Assert: Verify Action 3 execution - Bottleneck Pattern Identification
    expect(result.bottleneckPatterns).toBeDefined();
    expect(result.bottleneckPatterns).toHaveLength(1);
    expect(result.bottleneckPatterns[0]).toHaveProperty("bottleneckId");
    expect(result.bottleneckPatterns[0]).toHaveProperty("periodShift");
    expect(result.bottleneckPatterns[0].periodShift).toBe(
      "processA_to_processB"
    );
    expect(result.bottleneckPatterns[0].impactScore).toBe(7.5);
    expect(result.bottleneckPatterns[0].affectedProcesses).toEqual(["A", "B"]);
    expect(result.bottleneckPatterns[0].timeRange.from).toBe("2024-01-08");
    expect(result.bottleneckPatterns[0].timeRange.to).toBe("2024-01-12");

    // Assert: Verify Action 4 execution - Visualization Report Generation
    expect(result.reportMetadata).toBeDefined();
    expect(result.reportMetadata.reportId).toBe("RPT-001");
    expect(result.reportMetadata.generatedAt).toBe("2024-01-15T09:00:00Z");
    expect(result.reportMetadata.timeSeriesData).toHaveLength(5);
    expect(result.reportMetadata.timeSeriesData[0].bottleneckProcess).toBe("A");
    expect(result.reportMetadata.timeSeriesData[2].bottleneckProcess).toBe("B");
    expect(result.reportMetadata.graphCoordinates).toHaveLength(5);
    expect(result.reportMetadata.graphCoordinates[0]).toEqual({ x: 0, y: 8 });
    expect(result.reportMetadata.graphCoordinates[4]).toEqual({ x: 4, y: 5 });

    // Assert: Verify Action 5 execution - High Priority Issue Extraction
    expect(result.priorityExtraction).toBeDefined();
    expect(result.priorityExtraction.highlightedIssueIds).toHaveLength(2);
    expect(result.priorityExtraction.highlightedIssueIds).toContain(
      "ISSUE-004"
    );
    expect(result.priorityExtraction.highlightedIssueIds).toContain(
      "ISSUE-001"
    );
    expect(result.priorityExtraction.highPriorityThreshold).toBe(75);
    expect(result.priorityExtraction.priorityScores[0].score).toBe(85);
    expect(result.priorityExtraction.priorityScores[1].score).toBe(90);

    // Assert: Verify completion status
    expect(result.allActionsExecuted).toBe(true);
    expect(result.completedAt).toBeDefined();
    expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Assert: Verify escalation condition not triggered
    expect(result.escalationTriggered).toBe(false);
    expect(result.escalationReason).toBeUndefined();

    // Assert: Verify audit log contains Action 3 execution record
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog).toBeInstanceOf(Array);
    expect(result.auditLog.length).toBeGreaterThanOrEqual(1);

    const action3AuditEntry = result.auditLog.find(
      (entry: any) =>
        entry.actionType === "IDENTIFY_BOTTLENECK_PATTERN" ||
        entry.actionType === "Action_3"
    );
    expect(action3AuditEntry).toBeDefined();
    expect(action3AuditEntry).toHaveProperty("timestamp");
    expect(action3AuditEntry).toHaveProperty("inputDataHash");
    expect(action3AuditEntry).toHaveProperty("outputPatternIds");
    expect(action3AuditEntry.outputPatternIds).toContain("BN-001");

    // Assert: Verify AI client was called correct number of times with proper prompts
    expect(mockAiClient.callAction).toHaveBeenCalledTimes(5);

    // Verify Action 3 call specifically
    const action3Call = mockAiClient.callAction.mock.calls[2];
    expect(action3Call).toBeDefined();
    expect(action3Call[0]).toHaveProperty("version");
    expect(action3Call[0].version).toBe("1.0.0");

    // Assert: Verify report structure integrity
    expect(result).toHaveProperty("executionId");
    expect(result).toHaveProperty("issueDataset");
    expect(result).toHaveProperty("recurrencePatterns");
    expect(result).toHaveProperty("bottleneckPatterns");
    expect(result).toHaveProperty("reportMetadata");
    expect(result).toHaveProperty("priorityExtraction");
    expect(result).toHaveProperty("allActionsExecuted");
    expect(result).toHaveProperty("completedAt");
    expect(result).toHaveProperty("escalationTriggered");
    expect(result).toHaveProperty("auditLog");
  });
});