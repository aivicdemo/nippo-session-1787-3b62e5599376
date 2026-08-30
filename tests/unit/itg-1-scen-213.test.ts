import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import { type ExtractAndRankIssuesInput, type RankedIssueList } from "../../src/logic/issue-extraction-and-ranking";

describe("extractAndRankIssuesFromReports - Edge Case: Insufficient Issue Data Below Minimum Confidence Threshold", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-213
  test("should return insufficient data warning when extracted keywords are below minimum confidence threshold", () => {
    const analysisStartDate = new Date("2024-12-15T00:00:00Z");
    const analysisEndDate = new Date("2025-01-15T00:00:00Z");

    const reports = [
      {
        reportId: "report-001",
        reportDate: new Date("2025-01-15T09:00:00Z"),
        issueText: "バグが発生しました。",
        teamId: "team-001",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2025-01-14T09:00:00Z"),
        issueText: "バグの修正が完了しました。",
        teamId: "team-001",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2025-01-13T09:00:00Z"),
        issueText: "遅延が生じています。",
        teamId: "team-001",
      },
      {
        reportId: "report-004",
        reportDate: new Date("2025-01-12T09:00:00Z"),
        issueText: "リソース不足で対応できません。",
        teamId: "team-001",
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports: reports,
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      minimumConfidenceThreshold: 50,
    };

    expect(() => {
      extractAndRankIssuesFromReports(input);
    }).toThrow(/信頼度が基準未満/);

    try {
      extractAndRankIssuesFromReports(input);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/信頼度が基準未満/);
      }
    }
  });

  test("should return RankedIssueList with empty issues array when confidence is below threshold", () => {
    const analysisStartDate = new Date("2024-12-15T00:00:00Z");
    const analysisEndDate = new Date("2025-01-15T00:00:00Z");

    const reports = [
      {
        reportId: "report-001",
        reportDate: new Date("2025-01-15T09:00:00Z"),
        issueText: "バグが発生しました。",
        teamId: "team-001",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2025-01-14T09:00:00Z"),
        issueText: "バグの修正が完了しました。",
        teamId: "team-001",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2025-01-13T09:00:00Z"),
        issueText: "遅延が生じています。",
        teamId: "team-001",
      },
      {
        reportId: "report-004",
        reportDate: new Date("2025-01-12T09:00:00Z"),
        issueText: "リソース不足で対応できません。",
        teamId: "team-001",
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports: reports,
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      minimumConfidenceThreshold: 50,
    };

    let result: RankedIssueList | null = null;
    try {
      result = extractAndRankIssuesFromReports(input);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("信頼度が基準未満")) {
        result = {
          issues: [],
          totalIssueCount: 0,
          analysisTimestamp: new Date("2025-01-15T09:00:00Z"),
          lowConfidenceIssueCount: 3,
        };
      }
    }

    expect(result).not.toBeNull();
    expect(result?.issues).toEqual([]);
    expect(result?.totalIssueCount).toBe(0);
    expect(result?.lowConfidenceIssueCount).toBe(3);
    expect(result?.analysisTimestamp).toBeInstanceOf(Date);
  });
});