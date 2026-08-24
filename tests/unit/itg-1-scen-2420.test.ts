import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-2420
  test('should deduplicate identical report records when aggregating monthly data', () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';

    // Create identical report records - same userId, reportDate, and content
    const duplicateReportData = [
      {
        reportId: 'report-001',
        userId: 'engineer-a',
        reportDate: '2024-01-10',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed feature X development',
        todayPlan: 'Start feature Y development',
        currentIssues: 'Database connection timeout',
        submittedAt: '2024-01-10T08:30:00Z',
      },
      {
        reportId: 'report-002',
        userId: 'engineer-a',
        reportDate: '2024-01-10',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed feature X development',
        todayPlan: 'Start feature Y development',
        currentIssues: 'Database connection timeout',
        submittedAt: '2024-01-10T08:30:00Z',
      },
      {
        reportId: 'report-003',
        userId: 'engineer-a',
        reportDate: '2024-01-10',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed feature X development',
        todayPlan: 'Start feature Y development',
        currentIssues: 'Database connection timeout',
        submittedAt: '2024-01-10T08:30:00Z',
      },
    ];

    const result = extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
      reportRecords: duplicateReportData,
    });

    // Verify deduplication: 3 identical records should be reduced to 1
    expect(result.reportIds.length).toBe(1);
    expect(result.uniqueReportCount).toBe(1);

    // Verify the deduplicated record maintains original data integrity
    const aggregatedReports = result.aggregatedData;
    expect(aggregatedReports.length).toBe(1);

    const deduplicatedReport = aggregatedReports[0];
    expect(deduplicatedReport.userId).toBe('engineer-a');
    expect(deduplicatedReport.reportDate).toBe('2024-01-10');
    expect(deduplicatedReport.yesterdayAccomplishment).toBe(
      'Completed feature X development'
    );
    expect(deduplicatedReport.todayPlan).toBe('Start feature Y development');
    expect(deduplicatedReport.currentIssues).toBe('Database connection timeout');
    expect(deduplicatedReport.teamId).toBe('team-001');

    // Verify extraction period covers the target month
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
  });
});