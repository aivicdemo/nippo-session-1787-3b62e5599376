import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput, type RankedIssueList } from "../../src/logic/issue-extraction-and-ranking";

describe("Issue Extraction and Ranking", () => {
  // SCEN-211: Extract issues from reports where one report has empty issue text and should be ignored
  test("should extract and rank issues while ignoring empty issue text in reports", () => {
    const mockReports = [
      {
        reportId: "report-001",
        reportDate: new Date("2024-01-15"),
        issueText: "",
        teamId: "team-alpha",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2024-01-16"),
        issueText: "バグが多く発生",
        teamId: "team-alpha",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2024-01-17"),
        issueText: "リソース不足で遅延",
        teamId: "team-alpha",
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports: mockReports,
      analysisStartDate: new Date("2023-12-16"),
      analysisEndDate: new Date("2024-01-15"),
      minimumConfidenceThreshold: 50,
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.totalIssueCount).toBeGreaterThanOrEqual(0);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);

    const emptyReportIssues = result.issues.filter(
      (issue) => issue.issueId === "report-001"
    );
    expect(emptyReportIssues.length).toBe(0);

    expect(result.totalIssueCount).toBeLessThanOrEqual(
      mockReports.filter((r) => r.issueText.trim().length > 0).length * 3
    );
  });
});