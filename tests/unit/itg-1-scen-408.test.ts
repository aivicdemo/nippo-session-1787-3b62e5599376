import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import { type Report, type RankedIssueList } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出・優先度付け", () => {
  test("SCEN-408: 複数の日報から課題キーワードを自動抽出し、空または null の issueText をスキップして優先度付け一覧を生成する", () => {
    const analysisStartDate = new Date("2024-12-16T00:00:00Z");
    const analysisEndDate = new Date("2025-01-15T23:59:59Z");

    const reports: Report[] = [
      {
        reportId: "report-001",
        reportDate: new Date("2025-01-15T09:00:00Z"),
        issueText: "バグが発生しました。テストが失敗しています。",
        teamId: "team-A",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2025-01-15T09:15:00Z"),
        issueText: "",
        teamId: "team-B",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2025-01-15T09:30:00Z"),
        issueText: null as unknown as string,
        teamId: "team-C",
      },
      {
        reportId: "report-004",
        reportDate: new Date("2025-01-15T09:45:00Z"),
        issueText: "リソース不足により対応が遅延しています。",
        teamId: "team-A",
      },
      {
        reportId: "report-005",
        reportDate: new Date("2025-01-15T10:00:00Z"),
        issueText: "バグが再発しました。早急な対応が必要です。",
        teamId: "team-B",
      },
    ];

    const result = extractAndRankIssuesFromReports(
      reports,
      analysisStartDate,
      analysisEndDate
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("totalIssueCount");
    expect(result).toHaveProperty("analysisTimestamp");
    expect(result).toHaveProperty("lowConfidenceIssueCount");

    const typedResult = result as RankedIssueList;

    expect(Array.isArray(typedResult.issues)).toBe(true);
    expect(typeof typedResult.totalIssueCount).toBe("number");
    expect(typedResult.analysisTimestamp).toBeInstanceOf(Date);
    expect(typeof typedResult.lowConfidenceIssueCount).toBe("number");

    const validReportCount = reports.filter(
      (r) => r.issueText !== null && r.issueText !== ""
    ).length;

    expect(validReportCount).toBe(3);

    expect(typedResult.totalIssueCount).toBeGreaterThan(0);

    const emptyOrNullIssueReportIds = [
      "report-002",
      "report-003",
    ];
    const filteredIssueSourceIds = typedResult.issues
      .map((issue) => issue.issueId)
      .filter((issueId) =>
        emptyOrNullIssueReportIds.some((emptyId) => issueId.includes(emptyId))
      );

    expect(filteredIssueSourceIds.length).toBe(0);

    typedResult.issues.forEach((issue) => {
      expect(issue).toHaveProperty("issueId");
      expect(issue).toHaveProperty("keyword");
      expect(issue).toHaveProperty("frequency");
      expect(issue).toHaveProperty("impactScore");
      expect(issue).toHaveProperty("priorityScore");
      expect(issue).toHaveProperty("priorityRank");
      expect(issue).toHaveProperty("colorCode");
      expect(issue).toHaveProperty("confidenceScore");
      expect(issue).toHaveProperty("affectedTeamCount");

      expect(typeof issue.issueId).toBe("string");
      expect(typeof issue.keyword).toBe("string");
      expect(typeof issue.frequency).toBe("number");
      expect(typeof issue.impactScore).toBe("number");
      expect(typeof issue.priorityScore).toBe("number");
      expect(typeof issue.priorityRank).toBe("string");
      expect(typeof issue.colorCode).toBe("string");
      expect(typeof issue.confidenceScore).toBe("number");
      expect(typeof issue.affectedTeamCount).toBe("number");

      expect(issue.frequency).toBeGreaterThan(0);
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(["高", "中", "低"]).toContain(issue.priorityRank);
      expect(["red", "yellow", "green"]).toContain(issue.colorCode);
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(issue.confidenceScore).toBeLessThanOrEqual(100);
      expect(issue.affectedTeamCount).toBeGreaterThan(0);
    });

    expect(typedResult.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);
    expect(typedResult.lowConfidenceIssueCount).toBeLessThanOrEqual(
      typedResult.totalIssueCount
    );
  });
});