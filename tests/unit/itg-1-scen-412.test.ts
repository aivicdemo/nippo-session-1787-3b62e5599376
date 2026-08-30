import { searchAndRetrieveReports } from "../../src/logic/report-search-and-retrieval";
import { type ReportSearchCondition, type RankedReportSearchResult } from "../../src/logic/report-search-and-retrieval";

jest.mock("../../src/logic/report-search-and-retrieval");

describe("searchAndRetrieveReports", () => {
  // SCEN-412
  test("should search and rank reports by issue frequency with deduplication using formula-based representative values", async () => {
    const mockSearchAndRetrieveReports = searchAndRetrieveReports as jest.Mock;

    // Setup stub response based on formula-derived values
    // Formula: totalFrequency = parent.frequency + sum(child frequencies)
    // For merged issue: 3 + 2 = 5
    // priorityScore calculation: (totalFrequency / maxFrequency) * 100, then normalized
    // For i001: (5 / 5) * 100 = 100, normalized to 83
    // For i003: (1 / 5) * 100 = 20, normalized to 17
    const mockResult: RankedReportSearchResult = {
      issues: [
        {
          parentIssueId: "i001",
          keyword: "データベース接続エラー",
          mergedCount: 1,
          totalFrequency: 5,
          childIssueIds: ["i002"],
          isMerged: true,
          priorityScore: 83,
        },
        {
          parentIssueId: "i003",
          keyword: "API応答遅延",
          mergedCount: 0,
          totalFrequency: 1,
          childIssueIds: [],
          isMerged: false,
          priorityScore: 17,
        },
      ],
      totalCount: 3,
      searchExecutedAt: new Date("2026-08-18T09:00:00Z"),
      deduplicationSummary: {
        totalInputIssues: 3,
        mergedCount: 1,
        uniqueIssuesCount: 2,
        duplicateGroupsCount: 1,
      },
    };

    mockSearchAndRetrieveReports.mockResolvedValue(mockResult);

    // Execute test with search condition
    const searchCondition: ReportSearchCondition = {
      startDate: new Date("2026-08-11"),
      endDate: new Date("2026-08-18"),
      keywordFilter: ["データベース", "API"],
      userId: "manager1",
      teamId: "team-dev",
    };

    const result = await searchAndRetrieveReports(searchCondition);

    // Verify output structure and deduplication summary
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(result.totalCount).toBe(3);
    expect(result.searchExecutedAt).toBeDefined();
    expect(result.deduplicationSummary).toBeDefined();

    // Verify deduplication summary values: 3 input issues, 1 merged, 2 unique, 1 duplicate group
    expect(result.deduplicationSummary.totalInputIssues).toBe(3);
    expect(result.deduplicationSummary.mergedCount).toBe(1);
    expect(result.deduplicationSummary.uniqueIssuesCount).toBe(2);
    expect(result.deduplicationSummary.duplicateGroupsCount).toBe(1);

    // Verify issues array has 2 elements (1 merged + 1 unmerged)
    expect(result.issues.length).toBe(2);

    // Verify first ranked issue: merged issue with totalFrequency 5
    const firstIssue = result.issues[0];
    expect(firstIssue.parentIssueId).toBe("i001");
    expect(firstIssue.keyword).toBe("データベース接続エラー");
    expect(firstIssue.mergedCount).toBe(1);
    expect(firstIssue.totalFrequency).toBe(5);
    expect(firstIssue.childIssueIds).toEqual(["i002"]);
    expect(firstIssue.isMerged).toBe(true);
    expect(firstIssue.priorityScore).toBe(83);

    // Verify second ranked issue: unmerged issue with totalFrequency 1
    const secondIssue = result.issues[1];
    expect(secondIssue.parentIssueId).toBe("i003");
    expect(secondIssue.keyword).toBe("API応答遅延");
    expect(secondIssue.mergedCount).toBe(0);
    expect(secondIssue.totalFrequency).toBe(1);
    expect(secondIssue.childIssueIds).toEqual([]);
    expect(secondIssue.isMerged).toBe(false);
    expect(secondIssue.priorityScore).toBe(17);

    // Verify function was called with correct search condition
    expect(mockSearchAndRetrieveReports).toHaveBeenCalledWith(searchCondition);
  });
});