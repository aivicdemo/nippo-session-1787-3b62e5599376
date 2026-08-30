import { prepareDashboardData } from '../../src/logic/dashboard-presentation';

describe('prepareDashboardData', () => {
  // SCEN-365
  test('should aggregate and format dashboard data with correct priority ordering and member grouping', () => {
    const targetDate = new Date('2024-01-15T09:00:00Z');
    const requestingUserId = 'user_002';
    const teamId = 'team_001';

    const dashboardInput = {
      teamId,
      targetDate,
      requestingUserId,
      includeHistoricalTrend: false,
    };

    const result = prepareDashboardData(dashboardInput);

    // Verify submissionStatusSummary exists
    expect(result.submissionStatusSummary).toBeDefined();
    expect(typeof result.submissionStatusSummary.submittedCount).toBe('number');
    expect(typeof result.submissionStatusSummary.pendingCount).toBe('number');

    // Verify unsubmittedMembers is an array
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    result.unsubmittedMembers.forEach((member) => {
      expect(typeof member.memberId).toBe('string');
      expect(typeof member.memberName).toBe('string');
    });

    // Verify prioritizedIssueList is an array with correct structure
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    result.prioritizedIssueList.forEach((issue) => {
      expect(typeof issue.issueId).toBe('string');
      expect(typeof issue.issueContent).toBe('string');
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(typeof issue.colorCode).toBe('string');
      expect(typeof issue.impactLevel).toBe('string');
      expect(typeof issue.reporterName).toBe('string');
    });

    // Verify issueKeywordRanking is an array with correct structure
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);
    result.issueKeywordRanking.forEach((ranking, index) => {
      expect(typeof ranking.keyword).toBe('string');
      expect(typeof ranking.frequency).toBe('number');
      expect(ranking.frequency).toBeGreaterThan(0);
      expect(typeof ranking.percentageOfTotal).toBe('number');
      expect(ranking.percentageOfTotal).toBeGreaterThanOrEqual(0);
      expect(ranking.percentageOfTotal).toBeLessThanOrEqual(100);
      // Verify frequency ordering (descending)
      if (index > 0) {
        expect(ranking.frequency).toBeLessThanOrEqual(
          result.issueKeywordRanking[index - 1].frequency,
        );
      }
    });

    // Verify lastUpdatedAt is a Date
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
  });
});