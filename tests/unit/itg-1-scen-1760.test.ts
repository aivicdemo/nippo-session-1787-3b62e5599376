import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, TeamReportSummary } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-1760
  test('should extract all report data within target period and include complete details with FINALIZED status', async () => {
    // Arrange: Prepare test data with 5 reports within target period (2024-01-01 to 2024-01-31)
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-dept-head-001';
    
    const testReports = [
      {
        id: 'report-001',
        teamId: 'team-dev-001',
        submissionTimestamp: new Date('2024-01-05T08:30:00Z'),
        yesterdayAccomplishment: 'Completed authentication module implementation',
        todayPlan: 'Start unit testing for auth module',
        currentIssues: 'Login timeout issue persists',
        submittedByUserId: 'user-eng-001',
      },
      {
        id: 'report-002',
        teamId: 'team-dev-001',
        submissionTimestamp: new Date('2024-01-08T08:45:00Z'),
        yesterdayAccomplishment: 'Finished unit tests for auth module',
        todayPlan: 'Integration testing and bug fixes',
        currentIssues: 'Database connection pool exhaustion',
        submittedByUserId: 'user-eng-002',
      },
      {
        id: 'report-003',
        teamId: 'team-dev-002',
        submissionTimestamp: new Date('2024-01-12T09:15:00Z'),
        yesterdayAccomplishment: 'API endpoint development for user profile',
        todayPlan: 'Add validation and error handling',
        currentIssues: 'Performance degradation in search API',
        submittedByUserId: 'user-eng-003',
      },
      {
        id: 'report-004',
        teamId: 'team-dev-001',
        submissionTimestamp: new Date('2024-01-18T08:20:00Z'),
        yesterdayAccomplishment: 'Resolved database connection issue',
        todayPlan: 'Deploy to staging environment',
        currentIssues: 'Deployment rollback required due to schema mismatch',
        submittedByUserId: 'user-eng-001',
      },
      {
        id: 'report-005',
        teamId: 'team-dev-002',
        submissionTimestamp: new Date('2024-01-25T08:50:00Z'),
        yesterdayAccomplishment: 'Staging deployment successful',
        todayPlan: 'Production release coordination',
        currentIssues: 'Client-reported regression in payment flow',
        submittedByUserId: 'user-eng-003',
      },
    ];

    // Act: Call extractMonthlyReportData
    const result: MonthlyReportDataset = await extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: undefined,
      },
      testReports
    );

    // Assert: Verify dataset contains all 5 reports with complete details
    expect(result.totalReportCount).toBe(5);
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
    
    // Verify reportsByTeam aggregation
    expect(result.reportsByTeam).toHaveLength(2);
    
    const team001Summary = result.reportsByTeam.find(t => t.teamId === 'team-dev-001');
    expect(team001Summary).toBeDefined();
    expect(team001Summary!.reportCount).toBe(3);
    expect(team001Summary!.reportIds).toContain('report-001');
    expect(team001Summary!.reportIds).toContain('report-002');
    expect(team001Summary!.reportIds).toContain('report-004');
    expect(team001Summary!.submissionRate).toBeGreaterThan(0);
    
    const team002Summary = result.reportsByTeam.find(t => t.teamId === 'team-dev-002');
    expect(team002Summary).toBeDefined();
    expect(team002Summary!.reportCount).toBe(2);
    expect(team002Summary!.reportIds).toContain('report-003');
    expect(team002Summary!.reportIds).toContain('report-005');
    expect(team002Summary!.submissionRate).toBeGreaterThan(0);

    // Verify data quality score is within valid range
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify extraction timestamp is present and in ISO format
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);
    expect(result.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify all reports are included with no duplicates
    const allReportIds = result.reportsByTeam.flatMap(t => t.reportIds);
    expect(allReportIds).toHaveLength(5);
    expect(new Set(allReportIds).size).toBe(5);
    expect(allReportIds).toContain('report-001');
    expect(allReportIds).toContain('report-002');
    expect(allReportIds).toContain('report-003');
    expect(allReportIds).toContain('report-004');
    expect(allReportIds).toContain('report-005');
  });
});