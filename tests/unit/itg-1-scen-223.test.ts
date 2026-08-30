import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import type {
  ExtractAndRankIssuesInput,
  RankedIssueList,
  Report,
} from "../../src/logic/issue-extraction-and-ranking";

describe("Issue Extraction and Ranking", () => {
  // SCEN-223
  test("should return empty issues list when extracted keywords do not meet minimum confidence threshold", () => {
    const analysisStartDate = new Date("2024-12-15T00:00:00Z");
    const analysisEndDate = new Date("2025-01-14T23:59:59Z");

    const reports: Report[] = [
      {
        reportId: "report-001",
        reportDate: new Date("2025-01-14T09:00:00Z"),
        issueText: "軽微なバグが見つかりました",
        teamId: "team-001",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2025-01-13T09:00:00Z"),
        issueText: "スケジュール遅延の可能性があります",
        teamId: "team-001",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2025-01-12T09:00:00Z"),
        issueText: "リソース不足が課題です",
        teamId: "team-002",
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports,
      analysisStartDate,
      analysisEndDate,
      teamIds: ["team-001", "team-002"],
      minimumConfidenceThreshold: 80,
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    expect(result.issues).toEqual([]);
    expect(result.totalIssueCount).toBe(0);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(result.lowConfidenceIssueCount).toBeGreaterThan(0);
  });
});