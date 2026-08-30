import { prepareDashboardData } from "../../src/logic/dashboard-presentation";

describe("Dashboard Presentation Logic", () => {
  // SCEN-200: [edge] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。 - 報告データが空のときという明示された境界条件でignore
  test("prepareDashboardData returns valid dashboard display data when report submissions are empty", async () => {
    const teamId = "team-001";
    const targetDate = new Date("2024-01-15T00:00:00Z");
    const requestingUserId = "user-director-001";
    const includeHistoricalTrend = false;
    const reportSubmissions: any[] = [];

    const result = await prepareDashboardData(
      teamId,
      targetDate,
      requestingUserId,
      includeHistoricalTrend,
      reportSubmissions
    );

    expect(result).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary.totalSubmitted).toBe(0);
    expect(result.submissionStatusSummary.totalPending).toBe(10);
    expect(result.submissionStatusSummary.submissionRate).toBe(0);
    expect(result.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(10);
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.prioritizedIssueList.length).toBe(0);
    expect(result.issueKeywordRanking).toBeDefined();
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);
    expect(result.issueKeywordRanking.length).toBe(0);
    expect(result.lastUpdatedAt).toBeDefined();
    expect(result.lastUpdatedAt instanceof Date).toBe(true);
  });
});