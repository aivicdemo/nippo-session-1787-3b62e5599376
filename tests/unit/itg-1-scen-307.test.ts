import { prepareDashboardData } from "../../src/logic/dashboard-presentation";

describe("Dashboard Presentation Logic", () => {
  // SCEN-307
  test("should return empty prioritizedIssueList and issueKeywordRanking when no issues are extracted", async () => {
    const teamId = "team-001";
    const targetDate = new Date("2024-01-15T00:00:00Z");
    const requestingUserId = "user-director-001";
    const includeHistoricalTrend = false;

    const mockSubmissionStatusSummary = {
      submittedCount: 10,
      pendingCount: 0,
      submissionDeadline: "09:00",
      reportDate: "2024-01-15",
    };

    const mockUnsubmittedMembers: Array<{
      memberId: string;
      memberName: string;
    }> = [];

    const mockColorCodedIssues = {
      coloredIssues: [],
      colorDistribution: { red: 0, yellow: 0, green: 0 },
      highlightedIssueCount: 0,
    };

    const mockKeywordRanking = {
      rankedKeywords: [],
      totalKeywordCount: 0,
      aggregationPeriod: {
        startDate: "2024-01-15",
        endDate: "2024-01-15",
      },
      generatedAt: new Date("2024-01-15T09:30:00Z"),
    };

    const stubAggregateSubmissionStatusSummary = jest
      .fn()
      .mockReturnValue(mockSubmissionStatusSummary);

    const stubBuildUnsubmittedMembersList = jest
      .fn()
      .mockReturnValue(mockUnsubmittedMembers);

    const stubFormatIssueListWithColorCoding = jest
      .fn()
      .mockReturnValue(mockColorCodedIssues);

    const stubExtractIssueKeywordRanking = jest
      .fn()
      .mockReturnValue(mockKeywordRanking);

    const result = await prepareDashboardData(
      {
        teamId,
        targetDate,
        requestingUserId,
        includeHistoricalTrend,
      },
      {
        aggregateSubmissionStatusSummary: stubAggregateSubmissionStatusSummary,
        buildUnsubmittedMembersList: stubBuildUnsubmittedMembersList,
        formatIssueListWithColorCoding: stubFormatIssueListWithColorCoding,
        extractIssueKeywordRanking: stubExtractIssueKeywordRanking,
      }
    );

    expect(stubAggregateSubmissionStatusSummary).toHaveBeenCalledWith(
      teamId,
      "2024-01-15"
    );
    expect(stubBuildUnsubmittedMembersList).toHaveBeenCalledWith(
      teamId,
      targetDate
    );
    expect(stubFormatIssueListWithColorCoding).toHaveBeenCalledWith(
      expect.objectContaining({ issues: [] }),
      "standard"
    );

    expect(result.prioritizedIssueList).toEqual([]);
    expect(result.issueKeywordRanking).toEqual([]);
    expect(result.submissionStatusSummary).toEqual(mockSubmissionStatusSummary);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
  });
});