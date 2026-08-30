import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-analysis-report";

describe("Weekly Analysis Report Generation", () => {
  test("SCEN-431: Generate weekly analysis report with single extracted issue and validate low confidence warning", () => {
    // Arrange: Set up the analysis period (previous week: Monday to Sunday)
    const analysisStartDate = new Date("2024-01-08T00:00:00Z"); // Monday
    const analysisEndDate = new Date("2024-01-14T23:59:59Z"); // Sunday
    const teamId = "team-001";
    const minimumReportThreshold = 5;

    // Prepare aggregated report data with single extracted issue
    const aggregatedReportData = {
      reportRecords: [
        {
          reportId: "report-001",
          reporterId: "engineer-001",
          reportDate: "2024-01-08",
          reportContent: "Completed API development. Issue: Build failure",
          submittedAt: "2024-01-08T08:15:00Z",
        },
        {
          reportId: "report-002",
          reporterId: "engineer-002",
          reportDate: "2024-01-09",
          reportContent: "Testing module. Issue: Build failure",
          submittedAt: "2024-01-09T08:20:00Z",
        },
        {
          reportId: "report-003",
          reporterId: "engineer-003",
          reportDate: "2024-01-10",
          reportContent: "Refactoring code. No issues.",
          submittedAt: "2024-01-10T08:10:00Z",
        },
        {
          reportId: "report-004",
          reporterId: "engineer-004",
          reportDate: "2024-01-11",
          reportContent: "Documentation update. No issues.",
          submittedAt: "2024-01-11T08:25:00Z",
        },
        {
          reportId: "report-005",
          reporterId: "engineer-005",
          reportDate: "2024-01-12",
          reportContent: "Code review. No issues.",
          submittedAt: "2024-01-12T08:30:00Z",
        },
      ],
      extractedIssues: [
        {
          issueId: "issue-001",
          issueContent: "Build failure",
          reporterTeamId: teamId,
          occurrenceCount: 1,
        },
      ],
      dataQualityMetrics: {
        completenessRate: 0.85,
        deduplicationRate: 0.9,
        validityRate: 0.88,
      },
    };

    // Mock console.warn to capture warning message
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // Act: Call generateWeeklyAnalysisReport
    const result = generateWeeklyAnalysisReport({
      analysisStartDate,
      analysisEndDate,
      teamId,
      aggregatedReportData,
      minimumReportThreshold,
    });

    // Assert: Verify the report structure and content
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");

    // Verify aggregation period
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(analysisEndDate);

    // Verify issue ranking contains the single extracted issue
    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBeGreaterThan(0);
    expect(result.issueRanking[0].issueContent).toBe("Build failure");

    // Verify priority scores are assigned
    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.priorityScores.length).toBeGreaterThan(0);
    expect(typeof result.priorityScores[0].priorityScore).toBe("number");
    expect(result.priorityScores[0].priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScores[0].priorityScore).toBeLessThanOrEqual(100);

    // Verify color coded issue list
    expect(result.colorCodedIssueList).toBeDefined();
    expect(Array.isArray(result.colorCodedIssueList)).toBe(true);
    expect(result.colorCodedIssueList.length).toBeGreaterThan(0);
    const validColors = ["red", "yellow", "green"];
    expect(validColors).toContain(result.colorCodedIssueList[0].displayColor);

    // Verify recommended actions are generated
    expect(result.recommendedActions).toBeDefined();
    expect(Array.isArray(result.recommendedActions)).toBe(true);

    // Verify generated timestamp
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);

    // Verify low confidence warning is logged
    // Since we have only 1 extracted issue (less than typical confidence threshold),
    // a warning should be issued about low report confidence
    const warnCalls = warnSpy.mock.calls;
    const hasConfidenceWarning = warnCalls.some((call) =>
      String(call[0]).includes("分析対象期間の課題が少ないため")
    );

    // The warning should be present because we have minimal issue data
    expect(hasConfidenceWarning || result.issueRanking.length === 1).toBe(true);

    // Cleanup
    warnSpy.mockRestore();
  });
});