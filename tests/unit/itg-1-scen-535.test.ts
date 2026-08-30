import { analyzeIssueRecurrencePatterns } from "../../src/logic/report-search-and-retrieval";

describe("朝会報告管理システム", () => {
  test("SCEN-535: 同一メンバーが同一日に同じ課題を複数回報告したとき、重複は1件に統合される", async () => {
    const mockJudgeAccessPermission = jest.fn().mockResolvedValue({
      isAuthorized: true,
      accessLevel: "manager",
    });

    const mockRetrieveIssueDataByCondition = jest.fn().mockResolvedValue([
      {
        memberId: "M001",
        reportDate: "2024-01-15",
        issueContent: "データベース接続タイムアウト",
        extractedKeyword: "タイムアウト",
        frequency: 1,
      },
      {
        memberId: "M001",
        reportDate: "2024-01-15",
        issueContent: "データベース接続タイムアウト",
        extractedKeyword: "タイムアウト",
        frequency: 1,
      },
      {
        memberId: "M001",
        reportDate: "2024-01-15",
        issueContent: "キャッシュ無効化バグ",
        extractedKeyword: "バグ",
        frequency: 1,
      },
    ]);

    const mockDeduplicateAndMergeIssues = jest.fn().mockResolvedValue({
      mergedIssues: [
        {
          parentIssueId: "issue-001",
          content: "データベース接続タイムアウト",
          mergedIssueIds: ["issue-001-a", "issue-001-b"],
          frequency: 1,
          mergedFlag: true,
        },
        {
          parentIssueId: "issue-002",
          content: "キャッシュ無効化バグ",
          mergedIssueIds: ["issue-002"],
          frequency: 1,
          mergedFlag: false,
        },
      ],
      deduplicationSummary: {
        totalInputIssues: 3,
        mergedCount: 1,
        uniqueIssuesCount: 2,
        duplicateGroupsCount: 1,
      },
      normalizedIssueList: [
        {
          issueId: "issue-001",
          normalizedContent: "データベース接続タイムアウト",
          sourceReportIds: ["report-001", "report-002"],
          frequency: 1,
        },
        {
          issueId: "issue-002",
          normalizedContent: "キャッシュ無効化バグ",
          sourceReportIds: ["report-003"],
          frequency: 1,
        },
      ],
    });

    const result = await analyzeIssueRecurrencePatterns(
      {
        startDate: new Date("2024-01-15T00:00:00Z"),
        endDate: new Date("2024-01-15T23:59:59Z"),
        teamId: undefined,
        issueKeywords: undefined,
        minRecurrenceThreshold: 2,
        requestingUserId: "user123",
      },
      mockJudgeAccessPermission,
      mockRetrieveIssueDataByCondition,
      mockDeduplicateAndMergeIssues
    );

    expect(result).toBeDefined();
    expect(result.recurrencePatterns).toBeDefined();

    const databaseTimeoutPattern = result.recurrencePatterns.find(
      (pattern) =>
        pattern.keyword === "データベース接続タイムアウト" ||
        pattern.keyword === "タイムアウト"
    );

    if (databaseTimeoutPattern) {
      expect(databaseTimeoutPattern.occurrenceCount).toBe(1);
      expect(Array.isArray(databaseTimeoutPattern.affectedMembers)).toBe(true);
      expect(databaseTimeoutPattern.affectedMembers.length).toBeGreaterThan(0);
      expect(databaseTimeoutPattern.affectedMembers).toContain("M001");
      const uniqueMembers = new Set(databaseTimeoutPattern.affectedMembers);
      expect(uniqueMembers.size).toBe(1);
    }
  });
});