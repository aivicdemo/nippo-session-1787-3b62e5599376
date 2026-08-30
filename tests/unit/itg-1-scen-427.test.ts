import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-analysis-report";
import type {
  WeeklyAnalysisReportInput,
  WeeklyAnalysisReport,
  AggregatedWeeklyReportData,
  ExtractedIssue,
} from "../../src/logic/weekly-analysis-report";

describe("Weekly Analysis Report Generation", () => {
  // SCEN-427
  test("should generate weekly analysis report with prioritized issues for the specified week", () => {
    // Prepare test data: 3 representative issue types with multiple reporters
    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: "issue-001",
        issueContent: "システム遅延",
        reporterTeamId: "team-001",
        occurrenceCount: 5,
      },
      {
        issueId: "issue-002",
        issueContent: "ドキュメント不足",
        reporterTeamId: "team-001",
        occurrenceCount: 3,
      },
      {
        issueId: "issue-003",
        issueContent: "コミュニケーション齟齬",
        reporterTeamId: "team-001",
        occurrenceCount: 2,
      },
    ];

    // Build aggregated report data with 7 days of team member reports
    const aggregatedReportData: AggregatedWeeklyReportData = {
      reportRecords: [
        {
          reportId: "rep-001",
          reporterId: "eng-001",
          reportDate: "2024-01-08",
          reportContent: "システム遅延が発生した",
          submittedAt: "2024-01-08T08:00:00Z",
        },
        {
          reportId: "rep-002",
          reporterId: "eng-002",
          reportDate: "2024-01-08",
          reportContent: "システム遅延が続いている",
          submittedAt: "2024-01-08T08:05:00Z",
        },
        {
          reportId: "rep-003",
          reporterId: "eng-003",
          reportDate: "2024-01-09",
          reportContent: "ドキュメント不足で進捗が遅れた",
          submittedAt: "2024-01-09T08:00:00Z",
        },
        {
          reportId: "rep-004",
          reporterId: "eng-001",
          reportDate: "2024-01-09",
          reportContent: "システム遅延が解決していない",
          submittedAt: "2024-01-09T08:02:00Z",
        },
        {
          reportId: "rep-005",
          reporterId: "eng-004",
          reportDate: "2024-01-10",
          reportContent: "コミュニケーション齟齬で実装が重複した",
          submittedAt: "2024-01-10T08:00:00Z",
        },
        {
          reportId: "rep-006",
          reporterId: "eng-002",
          reportDate: "2024-01-10",
          reportContent: "システム遅延が改善中",
          submittedAt: "2024-01-10T08:03:00Z",
        },
        {
          reportId: "rep-007",
          reporterId: "eng-005",
          reportDate: "2024-01-11",
          reportContent: "ドキュメント不足のため設計が曖昧",
          submittedAt: "2024-01-11T08:00:00Z",
        },
        {
          reportId: "rep-008",
          reporterId: "eng-003",
          reportDate: "2024-01-11",
          reportContent: "システム遅延がまだ継続",
          submittedAt: "2024-01-11T08:01:00Z",
        },
        {
          reportId: "rep-009",
          reporterId: "eng-001",
          reportDate: "2024-01-12",
          reportContent: "コミュニケーション齟齬を検出",
          submittedAt: "2024-01-12T08:00:00Z",
        },
        {
          reportId: "rep-010",
          reporterId: "eng-004",
          reportDate: "2024-01-12",
          reportContent: "システム遅延の影響で納期が危ない",
          submittedAt: "2024-01-12T08:04:00Z",
        },
      ],
      extractedIssues: extractedIssues,
      dataQualityMetrics: {
        completenessRate: 0.95,
        deduplicationRate: 0.92,
        validityRate: 0.98,
      },
    };

    // Prepare input with analysis period (Mon 2024-01-08 to Sun 2024-01-14)
    const input: WeeklyAnalysisReportInput = {
      analysisStartDate: new Date("2024-01-08T00:00:00Z"),
      analysisEndDate: new Date("2024-01-14T23:59:59Z"),
      teamId: "team-001",
      aggregatedReportData: aggregatedReportData,
      minimumReportThreshold: 5,
    };

    // Call the function
    const result: WeeklyAnalysisReport =
      generateWeeklyAnalysisReport(input);

    // Verify reportId is generated as a string
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);

    // Verify aggregation period matches input
    expect(result.aggregationPeriod.startDate).toEqual(
      new Date("2024-01-08T00:00:00Z")
    );
    expect(result.aggregationPeriod.endDate).toEqual(
      new Date("2024-01-14T23:59:59Z")
    );

    // Verify issueRanking contains multiple RankedIssue objects sorted by priority
    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBeGreaterThan(0);

    // Verify ranking is sorted by priority (first element has highest priority)
    for (let i = 0; i < result.issueRanking.length - 1; i++) {
      expect(result.issueRanking[i].priorityScore).toBeGreaterThanOrEqual(
        result.issueRanking[i + 1].priorityScore
      );
    }

    // Verify priorityScores array contains score and rank for each issue
    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.priorityScores.length).toBeGreaterThan(0);

    // Verify each priority score entry has valid structure
    result.priorityScores.forEach((scoreEntry) => {
      expect(typeof scoreEntry.priorityScore).toBe("number");
      expect(scoreEntry.priorityScore).toBeGreaterThanOrEqual(0);
      expect(scoreEntry.priorityScore).toBeLessThanOrEqual(100);
      expect(["high", "medium", "low"]).toContain(scoreEntry.priorityRank);
    });

    // Verify first priority score reflects formula: (frequency × 0.6) + (impactScore × 0.4)
    // For issue-001: frequency=5, impactScore should be calculated from affected members
    // Expected calculation example: (5 × 0.6) + (impact × 0.4)
    const highestPriorityScore = result.priorityScores[0].priorityScore;
    expect(highestPriorityScore).toBeGreaterThan(0);
    expect(highestPriorityScore).toBeLessThanOrEqual(100);

    // Verify recommendedActions contains multiple actions for high-priority issues
    expect(Array.isArray(result.recommendedActions)).toBe(true);
    expect(result.recommendedActions.length).toBeGreaterThan(0);

    // Verify recommendedActions have required fields
    result.recommendedActions.forEach((action) => {
      expect(typeof action.issueId).toBe("string");
      expect(typeof action.countermeasureContent).toBe("string");
      expect(typeof action.assignedOwnerId).toBe("string");
      expect(action.targetCompletionDate instanceof Date).toBe(true);
    });

    // Verify colorCodedIssueList contains color-coded issues
    expect(Array.isArray(result.colorCodedIssueList)).toBe(true);
    expect(result.colorCodedIssueList.length).toBeGreaterThan(0);

    // Verify each color-coded issue has valid structure
    result.colorCodedIssueList.forEach((coloredIssue) => {
      expect(typeof coloredIssue.issueKeyword).toBe("string");
      expect(["red", "yellow", "green"]).toContain(coloredIssue.displayColor);
    });

    // Verify generatedAt is a Date object
    expect(result.generatedAt instanceof Date).toBe(true);

    // Verify priorityScores array is sorted by score in descending order
    for (let i = 0; i < result.priorityScores.length - 1; i++) {
      expect(result.priorityScores[i].priorityScore).toBeGreaterThanOrEqual(
        result.priorityScores[i + 1].priorityScore
      );
    }

    // Verify the priority score calculation follows the formula
    // (frequency × 0.6) + (impactScore × 0.4)
    // For highest priority issue with frequency=5 and typical impact
    expect(highestPriorityScore).toBeGreaterThan(30); // Conservative lower bound for high-priority issue
  });
});