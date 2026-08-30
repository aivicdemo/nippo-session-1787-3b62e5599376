import { prepareDashboardData } from "../../src/logic/dashboard-presentation";

describe("Dashboard Presentation Logic", () => {
  // SCEN-309: [edge] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。 - 影響を受けるメンバー数がチーム全体の人数を超えるときという明示された境界条件で影響度は最大100%に調整されます
  test("should cap impact level to 100% when affected members exceed team size", async () => {
    const teamSize = 10;
    const affectedMembers = 15;
    const reporterCount = 8;

    const dashboardInput = {
      teamId: "team-001",
      targetDate: new Date("2024-01-15"),
      requestingUserId: "user-manager-001",
      includeHistoricalTrend: false,
    };

    const mockSubmissionStatus = {
      submittedCount: 9,
      pendingCount: 1,
      memberStatuses: [
        {
          memberId: "user-001",
          name: "Alice",
          status: "submitted" as const,
          submittedAt: "2024-01-15T08:00:00Z",
          minutesUntilDeadline: 30,
        },
        {
          memberId: "user-002",
          name: "Bob",
          status: "pending" as const,
          minutesUntilDeadline: 30,
        },
      ],
    };

    const mockUnsubmittedMembers = [
      { memberId: "user-002", name: "Bob", minutesUntilDeadline: 30 },
    ];

    const mockIssuesWithOversizedImpact = [
      {
        issueId: "issue-001",
        issueContent: "重大な課題",
        priorityScore: 0,
        impactDegree: affectedMembers,
        frequency: reporterCount,
      },
    ];

    const mockKeywordRanking = [
      {
        rank: 1,
        keyword: "重大な課題",
        frequency: reporterCount,
        averageImpactScore: 100,
        colorCode: "#FFFF00",
        percentageOfTotal: 50.0,
      },
    ];

    const result = await prepareDashboardData(
      dashboardInput,
      mockSubmissionStatus,
      mockUnsubmittedMembers,
      mockIssuesWithOversizedImpact,
      mockKeywordRanking,
      teamSize
    );

    const expectedImpactRatioNormalized = Math.min(
      (affectedMembers / teamSize) * 100,
      100
    );
    const frequencyScore = (reporterCount / 7) * 100;
    const expectedPriorityScore = frequencyScore * 0.4 + expectedImpactRatioNormalized * 0.4;

    expect(result.prioritizedIssueList).toHaveLength(1);
    expect(result.prioritizedIssueList[0].issueId).toBe("issue-001");
    expect(result.prioritizedIssueList[0].impactLevel).toBe("medium");
    expect(result.prioritizedIssueList[0].colorCode).toBe("#FFFF00");
    expect(result.prioritizedIssueList[0].priorityScore).toBeCloseTo(
      expectedPriorityScore,
      1
    );
  });
});