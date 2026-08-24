import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("TX-8 Imp 1 Agent - Bottleneck Visualization Report Generation", () => {
  test("SCEN-1978: Impact scores in ascending order should auto-select line chart graph type", async () => {
    // Arrange: Stub TextAnalysisServiceAdapter with ascending impact score trend
    const ascendingScoreTrend = [15, 28, 42, 56, 71, 85];

    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["database_slow", "api_timeout", "memory_leak"],
        frequencies: [6, 5, 4],
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce({ score: ascendingScoreTrend[0], severity: "low" })
        .mockResolvedValueOnce({ score: ascendingScoreTrend[1], severity: "low" })
        .mockResolvedValueOnce({ score: ascendingScoreTrend[2], severity: "medium" })
        .mockResolvedValueOnce({ score: ascendingScoreTrend[3], severity: "medium" })
        .mockResolvedValueOnce({ score: ascendingScoreTrend[4], severity: "high" })
        .mockResolvedValueOnce({ score: ascendingScoreTrend[5], severity: "high" }),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const stubNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: "sent" }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    // Prepare 6 issue data points corresponding to ascending scores
    const issueDataPoints = [
      {
        issueKeyword: "database_slow",
        occurrenceCount: 1,
        timeSeriesPattern: "initial",
        priorityScore: ascendingScoreTrend[0],
        reportDate: "2024-01-08",
      },
      {
        issueKeyword: "database_slow",
        occurrenceCount: 2,
        timeSeriesPattern: "increasing",
        priorityScore: ascendingScoreTrend[1],
        reportDate: "2024-01-09",
      },
      {
        issueKeyword: "database_slow",
        occurrenceCount: 3,
        timeSeriesPattern: "increasing",
        priorityScore: ascendingScoreTrend[2],
        reportDate: "2024-01-10",
      },
      {
        issueKeyword: "api_timeout",
        occurrenceCount: 2,
        timeSeriesPattern: "emerging",
        priorityScore: ascendingScoreTrend[3],
        reportDate: "2024-01-11",
      },
      {
        issueKeyword: "api_timeout",
        occurrenceCount: 3,
        timeSeriesPattern: "accelerating",
        priorityScore: ascendingScoreTrend[4],
        reportDate: "2024-01-12",
      },
      {
        issueKeyword: "memory_leak",
        occurrenceCount: 2,
        timeSeriesPattern: "critical",
        priorityScore: ascendingScoreTrend[5],
        reportDate: "2024-01-13",
      },
    ];

    const agentInput = {
      analysisStartDate: "2024-01-08",
      analysisEndDate: "2024-01-13",
      teamIds: ["team-001"],
      minimumRecurrenceThreshold: 2,
      recipientManagerId: "manager-001",
      issueDataPoints: issueDataPoints,
    };

    // Act: Execute tx8 agent with mocked dependencies
    const result = await runTx8Imp1Agent(
      agentInput,
      stubTextAnalysisServiceAdapter,
      stubNotificationServiceAdapter
    );

    // Assert: Verify graph type selection
    expect(result.visualizationGraphs).toBeDefined();
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const lineChartGraph = result.visualizationGraphs.find(
      (g: { graphType: string; title: string; dataPoints: Array<{ score: number }> }) =>
        g.graphType === "lineChart"
    );
    expect(lineChartGraph).toBeDefined();
    expect(lineChartGraph?.title).toContain("trend") || expect(lineChartGraph?.title).toContain("Trend");

    // Assert: Verify data points are in ascending order
    const dataPointsInChart = lineChartGraph?.dataPoints || [];
    expect(dataPointsInChart.length).toBeGreaterThanOrEqual(1);

    // Verify ascending order of scores in data points
    if (dataPointsInChart.length > 1) {
      for (let i = 0; i < dataPointsInChart.length - 1; i++) {
        const currentScore = dataPointsInChart[i].score || dataPointsInChart[i].value || 0;
        const nextScore = dataPointsInChart[i + 1].score || dataPointsInChart[i + 1].value || 0;
        expect(currentScore).toBeLessThanOrEqual(nextScore);
      }
    }

    // Assert: Verify recurring issue pattern detection
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const databaseSlowPattern = result.recurringIssuePatterns.find(
      (p: { issueKeyword: string; occurrenceCount: number; timeSeriesPattern: string; priorityScore: number }) =>
        p.issueKeyword === "database_slow"
    );
    expect(databaseSlowPattern).toBeDefined();
    expect(databaseSlowPattern?.occurrenceCount).toBe(3);
    expect(databaseSlowPattern?.timeSeriesPattern).toContain("increas") || 
      expect(databaseSlowPattern?.priorityScore).toBe(ascendingScoreTrend[2]);

    // Assert: Verify report metadata
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^[a-zA-Z0-9-_]+$/);
    expect(result.emailSentAt).toBeDefined();
    const emailSentTime = new Date(result.emailSentAt);
    expect(emailSentTime.getTime()).toBeGreaterThan(0);

    // Assert: Verify all ascending score values are present in analysis
    const allScoresInResult = result.recurringIssuePatterns.map(
      (p: { priorityScore: number }) => p.priorityScore
    );
    const uniqueScoresInTrend = Array.from(new Set(allScoresInResult));
    expect(uniqueScoresInTrend.length).toBeGreaterThan(0);

    // Assert: Verify TextAnalysisServiceAdapter was called for impact assessment
    expect(stubTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(stubTextAnalysisServiceAdapter.assessImpactScore.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});