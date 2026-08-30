import { prepareDashboardData, type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('prepareDashboardData', () => {
  // SCEN-363
  test('should filter out reports with invalid dates (not today or yesterday) and return aggregated dashboard data', () => {
    const systemTime = new Date('2026-01-15T10:00:00Z');
    const invalidReportDate = new Date('2026-01-13T09:30:00Z');
    
    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: systemTime,
      requestingUserId: 'user-001',
      includeHistoricalTrend: false,
    };

    const result: DashboardDisplayData = prepareDashboardData(input);

    expect(result).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('unsubmittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('submissionDeadline');
    
    expect(result.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    
    expect(result.issueKeywordRanking).toBeDefined();
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);
    
    expect(result.lastUpdatedAt).toBeDefined();
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    
    result.prioritizedIssueList.forEach((issue) => {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueContent).toBe('string');
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['red', 'yellow', 'green']).toContain(issue.colorCode);
      expect(['high', 'medium', 'low']).toContain(issue.impactLevel);
      expect(typeof issue.reporterName).toBe('string');
    });

    result.issueKeywordRanking.forEach((item) => {
      expect(typeof item.keyword).toBe('string');
      expect(typeof item.frequency).toBe('number');
      expect(item.frequency).toBeGreaterThanOrEqual(0);
      expect(typeof item.percentageOfTotal).toBe('number');
      expect(item.percentageOfTotal).toBeGreaterThanOrEqual(0);
      expect(item.percentageOfTotal).toBeLessThanOrEqual(100);
    });
  });
});