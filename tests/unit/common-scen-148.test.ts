import { runTx8Imp1Agent, type Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("TX-8-IMP-1: 課題検索から可視化レポート作成までの自動実行", () => {
  // SCEN-148
  test("should execute automated issue search to visualization report generation with highlighted high-priority issues", async () => {
    // ===== Setup: Mock AI Client and Dependencies =====
    const mockIssueDataset = [
      {
        issueId: "ISSUE-001",
        title: "Database connection timeout",
        priority: "HIGH",
        recurrenceCount: 5,
        lastOccurrenceDatetime: "2024-01-15T10:30:00Z",
        detectedDatetime: "2024-01-10T09:00:00Z",
      },
      {
        issueId: "ISSUE-002",
        title: "API response delay",
        priority: "HIGH",
        recurrenceCount: 3,
        lastOccurrenceDatetime: "2024-01-15T11:00:00Z",
        detectedDatetime: "2024-01-12T14:00:00Z",
      },
      {
        issueId: "ISSUE-003",
        title: "Cache invalidation logic",
        priority: "HIGH",
        recurrenceCount: 4,
        lastOccurrenceDatetime: "2024-01-14T15:30:00Z",
        detectedDatetime: "2024-01-08T08:00:00Z",
      },
      {
        issueId: "ISSUE-004",
        title: "Memory leak in worker threads",
        priority: "MEDIUM",
        recurrenceCount: 2,
        lastOccurrenceDatetime: "2024-01-15T09:00:00Z",
        detectedDatetime: "2024-01-13T11:00:00Z",
      },
      {
        issueId: "ISSUE-005",
        title: "Logging buffer overflow",
        priority: "MEDIUM",
        recurrenceCount: 1,
        lastOccurrenceDatetime: "2024-01-15T08:00:00Z",
        detectedDatetime: "2024-01-14T16:00:00Z",
      },
      {
        issueId: "ISSUE-006",
        title: "Configuration file parsing",
        priority: "LOW",
        recurrenceCount: 1,
        lastOccurrenceDatetime: "2024-01-14T12:00:00Z",
        detectedDatetime: "2024-01-14T12:00:00Z",
      },
      {
        issueId: "ISSUE-007",
        title: "Documentation typo",
        priority: "LOW",
        recurrenceCount: 0,
        lastOccurrenceDatetime: "2024-01-13T10:00:00Z",
        detectedDatetime: "2024-01-13T10:00:00Z",
      },
      {
        issueId: "ISSUE-008",
        title: "Intermittent network failure",
        priority: "HIGH",
        recurrenceCount: 6,
        lastOccurrenceDatetime: "2024-01-15T12:00:00Z",
        detectedDatetime: "2024-01-07T07:00:00Z",
      },
      {
        issueId: "ISSUE-009",
        title: "Session timeout edge case",
        priority: "MEDIUM",
        recurrenceCount: 2,
        lastOccurrenceDatetime: "2024-01-14T14:00:00Z",
        detectedDatetime: "2024-01-11T13:00:00Z",
      },
      {
        issueId: "ISSUE-010",
        title: "Race condition in queue processing",
        priority: "HIGH",
        recurrenceCount: 7,
        lastOccurrenceDatetime: "2024-01-15T13:30:00Z",
        detectedDatetime: "2024-01-06T06:00:00Z",
      },
      {
        issueId: "ISSUE-011",
        title: "Disk space warning threshold",
        priority: "MEDIUM",
        recurrenceCount: 3,
        lastOccurrenceDatetime: "2024-01-15T07:00:00Z",
        detectedDatetime: "2024-01-09T09:30:00Z",
      },
      {
        issueId: "ISSUE-012",
        title: "Duplicate message handling",
        priority: "HIGH",
        recurrenceCount: 8,
        lastOccurrenceDatetime: "2024-01-15T14:00:00Z",
        detectedDatetime: "2024-01-05T05:00:00Z",
      },
    ];

    const mockPatternAnalysisResult = {
      patterns: [
        {
          patternId: "PATTERN-001",
          name: "Connection Timeout Cycle",
          occurrenceCount: 15,
          timeline: [
            { date: "2024-01-10", count: 2 },
            { date: "2024-01-12", count: 3 },
            { date: "2024-01-14", count: 5 },
            { date: "2024-01-15", count: 5 },
          ],
        },
        {
          patternId: "PATTERN-002",
          name: "Race Condition Spike",
          occurrenceCount: 22,
          timeline: [
            { date: "2024-01-06", count: 2 },
            { date: "2024-01-08", count: 4 },
            { date: "2024-01-12", count: 6 },
            { date: "2024-01-15", count: 10 },
          ],
        },
      ],
    };

    const mockBottleneckChanges = [
      {
        pattern: "Database Latency Increase",
        severity: "CRITICAL",
        changePercent: 45,
        affectedIssueIds: ["ISSUE-001", "ISSUE-008"],
      },
      {
        pattern: "Message Queue Backlog",
        severity: "HIGH",
        changePercent: 32,
        affectedIssueIds: ["ISSUE-010", "ISSUE-012"],
      },
      {
        pattern: "Memory Pressure Trend",
        severity: "MEDIUM",
        changePercent: 18,
        affectedIssueIds: ["ISSUE-004"],
      },
    ];

    const mockReportMetadata = {
      generatedAt: "2024-01-15T15:00:00Z",
      dataRange: {
        startDate: "2024-01-05T00:00:00Z",
        endDate: "2024-01-15T23:59:59Z",
      },
      analyzedCount: 12,
      reportId: "REPORT-TX8-20240115-001",
    };

    const mockAuditEvents: Array<{
      action: string;
      status: string;
      executedAt: string;
      details?: Record<string, unknown>;
    }> = [];

    // Mock AI Client implementation
    const mockAiClient: Tx8Imp1AiClient = {
      // Action 1: Extract issue data from system
      extractIssueDataFromSystem: jest
        .fn()
        .mockResolvedValue({
          success: true,
          extractedCount: mockIssueDataset.length,
          issues: mockIssueDataset,
        }),

      // Action 2: Analyze recurrence patterns in time series
      analyzeRecurrencePatternsTimeSeries: jest
        .fn()
        .mockResolvedValue({
          success: true,
          analysisResult: mockPatternAnalysisResult,
        }),

      // Action 3: Identify bottleneck change patterns
      identifyBottleneckChangePatterns: jest
        .fn()
        .mockResolvedValue({
          success: true,
          bottleneckChanges: mockBottleneckChanges,
        }),

      // Action 4: Generate visualization report
      generateVisualizationReport: jest
        .fn()
        .mockResolvedValue({
          success: true,
          reportMetadata: mockReportMetadata,
          chartData: [
            {
              chartId: "CHART-001",
              type: "time_series",
              title: "Issue Recurrence Trend",
            },
            {
              chartId: "CHART-002",
              type: "bar",
              title: "Pattern Distribution",
            },
          ],
        }),

      // Action 5: Extract and highlight high-priority issues
      extractAndHighlightHighPriorityIssues: jest
        .fn()
        .mockResolvedValue({
          success: true,
          highlightedIssues: [
            {
              issueId: "ISSUE-012",
              priority: "HIGH",
              recurrenceCount: 8,
              lastOccurrenceDatetime: "2024-01-15T14:00:00Z",
              highlightReason: "Highest recurrence count in HIGH priority",
            },
            {
              issueId: "ISSUE-010",
              priority: "HIGH",
              recurrenceCount: 7,
              lastOccurrenceDatetime: "2024-01-15T13:30:00Z",
              highlightReason: "Critical race condition pattern detected",
            },
            {
              issueId: "ISSUE-008",
              priority: "HIGH",
              recurrenceCount: 6,
              lastOccurrenceDatetime: "2024-01-15T12:00:00Z",
              highlightReason: "Network failure recurrence escalating",
            },
            {
              issueId: "ISSUE-001",
              priority: "HIGH",
              recurrenceCount: 5,
              lastOccurrenceDatetime: "2024-01-15T10:30:00Z",
              highlightReason: "Database timeout pattern trending",
            },
          ],
        }),

      // Audit event recording
      generateAuditEvent: jest.fn().mockResolvedValue({
        success: true,
        auditId: "AUDIT-TX8-20240115-001",
      }),
    };

    const input = {
      analysisPeriodStartDate: "2024-01-05T00:00:00Z",
      analysisPeriodEndDate: "2024-01-15T23:59:59Z",
      managerEmail: "manager@example.com",
      minimumDataThreshold: 10,
    };

    // ===== Execute: Call the orchestrator =====
    const output = await runTx8Imp1Agent(input, mockAiClient);

    // ===== Verify: Orchestrator parameter structure =====
    expect(mockAiClient.extractIssueDataFromSystem).toBeDefined();
    expect(mockAiClient.analyzeRecurrencePatternsTimeSeries).toBeDefined();
    expect(mockAiClient.identifyBottleneckChangePatterns).toBeDefined();
    expect(mockAiClient.generateVisualizationReport).toBeDefined();
    expect(mockAiClient.extractAndHighlightHighPriorityIssues).toBeDefined();
    expect(mockAiClient.generateAuditEvent).toBeDefined();

    // ===== Verify Action 1: Extract issue data (minimum threshold check) =====
    expect(mockAiClient.extractIssueDataFromSystem).toHaveBeenCalled();
    const action1Call = mockAiClient.extractIssueDataFromSystem.mock.results[0];
    const action1Data = await action1Call.value;
    expect(action1Data.extractedCount).toBeGreaterThanOrEqual(10);

    // ===== Verify Action 2: Recurrence pattern analysis =====
    expect(mockAiClient.analyzeRecurrencePatternsTimeSeries).toHaveBeenCalled();
    const action2Call = mockAiClient.analyzeRecurrencePatternsTimeSeries.mock
      .results[0];
    const action2Data = await action2Call.value;
    expect(action2Data.analysisResult.patterns).toBeDefined();
    expect(action2Data.analysisResult.patterns).toBeInstanceOf(Array);
    expect(action2Data.analysisResult.patterns.length).toBeGreaterThan(0);

    const pattern = action2Data.analysisResult.patterns[0];
    expect(pattern).toHaveProperty("patternId");
    expect(pattern).toHaveProperty("occurrenceCount");
    expect(pattern).toHaveProperty("timeline");

    // ===== Verify Action 3: Bottleneck change pattern identification =====
    expect(mockAiClient.identifyBottleneckChangePatterns).toHaveBeenCalled();
    const action3Call = mockAiClient.identifyBottleneckChangePatterns.mock
      .results[0];
    const action3Data = await action3Call.value;
    expect(action3Data.bottleneckChanges).toBeDefined();
    expect(action3Data.bottleneckChanges).toBeInstanceOf(Array);

    const bottleneckChange = action3Data.bottleneckChanges[0];
    expect(bottleneckChange).toHaveProperty("pattern");
    expect(bottleneckChange).toHaveProperty("severity");
    expect(bottleneckChange).toHaveProperty("changePercent");

    // ===== Verify Action 4: Visualization report generation =====
    expect(mockAiClient.generateVisualizationReport).toHaveBeenCalled();
    const action4Call = mockAiClient.generateVisualizationReport.mock
      .results[0];
    const action4Data = await action4Call.value;
    expect(action4Data.reportMetadata).toBeDefined();
    expect(action4Data.reportMetadata).toHaveProperty("generatedAt");
    expect(action4Data.reportMetadata).toHaveProperty("dataRange");
    expect(action4Data.reportMetadata).toHaveProperty("analyzedCount");

    // ===== Verify Action 5: Extract and highlight high-priority issues =====
    expect(mockAiClient.extractAndHighlightHighPriorityIssues).toHaveBeenCalled();
    const action5Call = mockAiClient.extractAndHighlightHighPriorityIssues.mock
      .results[0];
    const action5Data = await action5Call.value;

    const highlightedIssues = action5Data.highlightedIssues;
    expect(highlightedIssues).toBeDefined();
    expect(highlightedIssues).toBeInstanceOf(Array);
    expect(highlightedIssues.length).toBeGreaterThanOrEqual(3);

    // Verify all highlighted issues have priority HIGH
    highlightedIssues.forEach((issue) => {
      expect(issue.priority).toBe("HIGH");
    });

    // ===== Verify required fields in highlighted issues =====
    highlightedIssues.forEach((issue) => {
      expect(issue).toHaveProperty("issueId");
      expect(issue).toHaveProperty("priority");
      expect(issue).toHaveProperty("recurrenceCount");
      expect(issue).toHaveProperty("lastOccurrenceDatetime");
      expect(issue).toHaveProperty("highlightReason");

      expect(typeof issue.issueId).toBe("string");
      expect(typeof issue.priority).toBe("string");
      expect(typeof issue.recurrenceCount).toBe("number");
      expect(typeof issue.lastOccurrenceDatetime).toBe("string");
      expect(typeof issue.highlightReason).toBe("string");
    });

    // ===== Verify highlighted issues are sorted by recurrenceCount in descending order =====
    for (let i = 0; i < highlightedIssues.length - 1; i++) {
      expect(highlightedIssues[i].recurrenceCount).toBeGreaterThanOrEqual(
        highlightedIssues[i + 1].recurrenceCount
      );
    }

    // ===== Verify expected sorted order =====
    expect(highlightedIssues[0].issueId).toBe("ISSUE-012");
    expect(highlightedIssues[0].recurrenceCount).toBe(8);
    expect(highlightedIssues[1].issueId).toBe("ISSUE-010");
    expect(highlightedIssues[1].recurrenceCount).toBe(7);
    expect(highlightedIssues[2].issueId).toBe("ISSUE-008");
    expect(highlightedIssues[2].recurrenceCount).toBe(6);
    expect(highlightedIssues[3].issueId).toBe("ISSUE-001");
    expect(highlightedIssues[3].recurrenceCount).toBe(5);

    // ===== Verify audit event is recorded =====
    expect(mockAiClient.generateAuditEvent).toHaveBeenCalled();
    const auditCall = mockAiClient.generateAuditEvent.mock.calls[0][0];
    expect(auditCall).toHaveProperty("action");
    expect(auditCall).toHaveProperty("status");
    expect(auditCall).toHaveProperty("executedAt");

    // Verify audit event details
    expect(auditCall.action).toBe("HIGHLIGHT_HIGH_PRIORITY_ISSUES");
    expect(auditCall.status).toBe("SUCCESS");
    expect(typeof auditCall.executedAt).toBe("string");

    // ===== Verify output structure =====
    expect(output).toBeDefined();
    expect(output).toHaveProperty("reportId");
    expect(output).toHaveProperty("analysisStatus");
    expect(output).toHaveProperty("recurringIssueCount");
    expect(output).toHaveProperty("reportDeliveryStatus");

    expect(output.reportId).toBe("REPORT-TX8-20240115-001");
    expect(output.analysisStatus).toBe("completed");
    expect(output.recurringIssueCount).toBeGreaterThanOrEqual(3);
    expect(output.reportDeliveryStatus).toMatch(/sent|pending|failed/);
  });
});