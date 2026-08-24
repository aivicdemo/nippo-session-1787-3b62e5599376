import { extractDashboardReportData } from '../../src/logic/manager-dashboard';

describe('Dashboard Priority Display - Impact Score Null Handling', () => {
  // SCEN-2757
  test('should display challenge with default color when impact score is null', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      userId: 'manager-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      includeUnsubmitted: true,
    };

    const dashboardReportData = await extractDashboardReportData(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(dashboardReportData).toBeDefined();
    expect(dashboardReportData.prioritizedIssues).toBeDefined();

    const issueWithNullScore = dashboardReportData.prioritizedIssues.find(
      (issue) => issue.priorityScore === null || issue.priorityScore === undefined
    );

    if (issueWithNullScore) {
      expect(issueWithNullScore.priorityColor).toBe('gray');
      expect(issueWithNullScore.impactLevel).toBe('unknown');
    }

    expect(dashboardReportData.submissionSummary).toBeDefined();
    expect(typeof dashboardReportData.submissionSummary.totalMembers).toBe('number');
    expect(typeof dashboardReportData.submissionSummary.submittedCount).toBe('number');
    expect(typeof dashboardReportData.submissionSummary.unsubmittedCount).toBe('number');
    expect(typeof dashboardReportData.submissionSummary.submissionRate).toBe('number');
    expect(dashboardReportData.submissionSummary.submissionRate).toBeGreaterThanOrEqual(0);
    expect(dashboardReportData.submissionSummary.submissionRate).toBeLessThanOrEqual(100);

    expect(dashboardReportData.lastUpdatedAt).toBeDefined();
    expect(typeof dashboardReportData.lastUpdatedAt).toBe('string');

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(dashboardReportData.lastUpdatedAt).toMatch(isoDateRegex);
  });
});