import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput, type RankedIssueList, type Report } from "../../src/logic/issue-extraction-and-ranking";

describe("Issue Extraction and Ranking", () => {
  // SCEN-207: [edge] 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する。 - 課題項目のテキストが空または100文字を超えるときという明示された境界条件で不正な形式の課題テキストはスキップされます
  test("should skip invalid issue text and extract only valid reports", () => {
    // Arrange
    const validIssueText = "Database connection timeout during peak hours affecting application response time";
    const emptyIssueText = "";
    const oversizedIssueText =
      "This is a very long issue text that exceeds one hundred characters in total length to test the upper boundary condition for issue text validation purposes in the system architecture";

    const reports: Report[] = [
      {
        reportId: "report-empty",
        reportDate: new Date("2024-01-15"),
        issueText: emptyIssueText,
        teamId: "team-001",
      },
      {
        reportId: "report-oversized",
        reportDate: new Date("2024-01-15"),
        issueText: oversizedIssueText,
        teamId: "team-001",
      },
      {
        reportId: "report-valid",
        reportDate: new Date("2024-01-15"),
        issueText: validIssueText,
        teamId: "team-001",
      },
    ];

    const analysisStartDate = new Date("2023-12-16");
    const analysisEndDate = new Date("2024-01-15");
    const minimumConfidenceThreshold = 50;

    const input: ExtractAndRankIssuesInput = {
      reports: reports,
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      minimumConfidenceThreshold: minimumConfidenceThreshold,
    };

    // Act
    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    // Assert
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);

    const issuesFromEmptyReport = result.issues.filter(
      (issue) =>
        issue.issueId &&
        issue.issueId.startsWith("report-empty")
    );
    expect(issuesFromEmptyReport.length).toBe(0);

    const issuesFromOversizedReport = result.issues.filter(
      (issue) =>
        issue.issueId &&
        issue.issueId.startsWith("report-oversized")
    );
    expect(issuesFromOversizedReport.length).toBe(0);

    const issuesFromValidReport = result.issues.filter(
      (issue) =>
        issue.issueId &&
        issue.issueId.startsWith("report-valid")
    );
    expect(issuesFromValidReport.length).toBeGreaterThan(0);

    expect(result.totalIssueCount).toBe(issuesFromValidReport.length);
    expect(result.analysisTimestamp).toBeDefined();
    expect(result.analysisTimestamp instanceof Date).toBe(true);
  });
});