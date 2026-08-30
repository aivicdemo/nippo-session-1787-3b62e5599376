import { prepareDashboardData, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('Dashboard Data Preparation', () => {
  // SCEN-383
  test('should prepare dashboard data with submission status summary, unsubmitted members, prioritized issues, and keyword rankings', () => {
    const accessTimestamp = new Date('2026-08-19T10:00:00Z');
    const lastReportSubmissionTime = new Date('2026-08-19T09:58:00Z');
    const lastDashboardRefreshTime = new Date('2026-08-19T09:57:00Z');
    const refreshThresholdSeconds = 60;

    const timeSinceLastRefresh = Math.floor(
      (accessTimestamp.getTime() - lastDashboardRefreshTime.getTime()) / 1000
    );
    const needsRefresh =
      lastReportSubmissionTime > lastDashboardRefreshTime ||
      timeSinceLastRefresh > refreshThresholdSeconds;

    expect(timeSinceLastRefresh).toBe(180);
    expect(needsRefresh).toBe(true);

    const mockDashboardDisplayData: DashboardDisplayData = {
      submissionStatusSummary: {
        submittedCount: 7,
        pendingCount: 3,
        submissionRate: 70,
        deadline: new Date('2026-08-19T09:30:00Z'),
      },
      unsubmittedMembers: [
        { memberId: 'E004', memberName: 'Alice Chen', colorCode: '#FF0000' },
        { memberId: 'E008', memberName: 'Bob Smith', colorCode: '#FF0000' },
        { memberId: 'E010', memberName: 'Carol White', colorCode: '#FF0000' },
      ],
      prioritizedIssueList: [
        {
          issueId: 'ISS001',
          issueContent: 'Build timeout on CI/CD pipeline',
          priorityScore: 85,
          colorCode: '#FF0000',
          impactLevel: 'high',
          reporterName: 'David Lee',
        },
        {
          issueId: 'ISS002',
          issueContent: 'Delayed API response in production',
          priorityScore: 72,
          colorCode: '#FFD700',
          impactLevel: 'medium',
          reporterName: 'Eve Johnson',
        },
      ],
      issueKeywordRanking: [
        {
          rank: 1,
          keyword: 'delay',
          frequency: 5,
          averageImpactScore: 8.2,
          colorCode: '#FF0000',
          percentageOfTotal: 35.7,
        },
        {
          rank: 2,
          keyword: 'bug',
          frequency: 4,
          averageImpactScore: 7.5,
          colorCode: '#FFD700',
          percentageOfTotal: 28.6,
        },
      ],
      lastUpdatedAt: new Date('2026-08-19T10:00:00Z'),
    };

    const result = prepareDashboardData(
      mockDashboardDisplayData.submissionStatusSummary,
      mockDashboardDisplayData.unsubmittedMembers,
      mockDashboardDisplayData.prioritizedIssueList,
      mockDashboardDisplayData.issueKeywordRanking,
      accessTimestamp,
      lastReportSubmissionTime,
      lastDashboardRefreshTime,
      refreshThresholdSeconds
    );

    expect(result.isFresh).toBe(false);
    expect(result.refreshExecuted).toBe(true);
    expect(result.currentDataTimestamp).toEqual(
      new Date('2026-08-19T10:00:00Z')
    );
    expect(result.staleDurationSeconds).toBe(0);

    expect(result.dashboardData.submissionStatusSummary.submittedCount).toBe(7);
    expect(result.dashboardData.submissionStatusSummary.pendingCount).toBe(3);
    expect(result.dashboardData.submissionStatusSummary.submissionRate).toBe(70);

    expect(result.dashboardData.unsubmittedMembers).toHaveLength(3);
    expect(result.dashboardData.unsubmittedMembers[0].memberId).toBe('E004');
    expect(result.dashboardData.unsubmittedMembers[0].memberName).toBe(
      'Alice Chen'
    );
    expect(result.dashboardData.unsubmittedMembers[0].colorCode).toBe(
      '#FF0000'
    );

    expect(result.dashboardData.prioritizedIssueList).toHaveLength(2);
    expect(result.dashboardData.prioritizedIssueList[0].issueId).toBe('ISS001');
    expect(result.dashboardData.prioritizedIssueList[0].priorityScore).toBe(85);
    expect(result.dashboardData.prioritizedIssueList[0].colorCode).toBe(
      '#FF0000'
    );
    expect(result.dashboardData.prioritizedIssueList[0].impactLevel).toBe(
      'high'
    );

    expect(result.dashboardData.issueKeywordRanking).toHaveLength(2);
    expect(result.dashboardData.issueKeywordRanking[0].rank).toBe(1);
    expect(result.dashboardData.issueKeywordRanking[0].keyword).toBe('delay');
    expect(result.dashboardData.issueKeywordRanking[0].frequency).toBe(5);
    expect(result.dashboardData.issueKeywordRanking[0].percentageOfTotal).toBe(
      35.7
    );

    expect(result.dashboardData.lastUpdatedAt).toEqual(
      new Date('2026-08-19T10:00:00Z')
    );
  });
});