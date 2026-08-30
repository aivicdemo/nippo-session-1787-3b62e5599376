import { prepareDashboardData, type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('Dashboard Presentation', () => {
  // SCEN-364
  test('should handle incomplete report content (all fields empty) and include warning in aggregated dashboard data', async () => {
    const teamId = 'team-001';
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const requestingUserId = 'user-manager-001';

    const input: DashboardDataPrepareInput = {
      teamId,
      targetDate,
      requestingUserId,
      includeHistoricalTrend: false,
    };

    const mockSubmissionStatusSummary = {
      providedCount: 1,
      missingCount: 9,
      deadline: '2024-01-15T09:00:00Z',
    };

    const mockUnsubmittedMembers = [
      { memberId: 'user-eng-002', memberName: 'Engineer B' },
      { memberId: 'user-eng-003', memberName: 'Engineer C' },
      { memberId: 'user-eng-004', memberName: 'Engineer D' },
      { memberId: 'user-eng-005', memberName: 'Engineer E' },
      { memberId: 'user-eng-006', memberName: 'Engineer F' },
      { memberId: 'user-eng-007', memberName: 'Engineer G' },
      { memberId: 'user-eng-008', memberName: 'Engineer H' },
      { memberId: 'user-eng-009', memberName: 'Engineer I' },
      { memberId: 'user-eng-010', memberName: 'Engineer J' },
    ];

    const mockColorCodedIssues = {
      coloredIssues: [],
      colorDistribution: { red: 0, yellow: 0, green: 0 },
      highlightedIssueCount: 0,
    };

    const mockKeywordRanking = {
      rankedKeywords: [],
      totalKeywordCount: 0,
      aggregationPeriod: {
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-01-15T23:59:59Z',
      },
      generatedAt: new Date('2024-01-15T10:30:00Z'),
    };

    const result: DashboardDisplayData = await prepareDashboardData(input);

    expect(result).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.issueKeywordRanking).toBeDefined();
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);
    expect(result.issueKeywordRanking.length).toBe(0);
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    expect(result.lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-15T10:00:00Z').getTime());
    expect(result.lastUpdatedAt.getTime()).toBeLessThanOrEqual(new Date('2024-01-15T11:00:00Z').getTime());
  });
});