import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-2414: 集約期間の開始日が月初のとき、その月の初日から正確に集約対象に含まれる
  test('should include reports from the first day of the month when aggregation start date is month start', () => {
    const aggregationStartDate = new Date('2026-03-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-03-31T23:59:59.999Z');

    const reportRecords = [
      {
        reportId: 'report-prev-day',
        createdAt: new Date('2026-02-28T23:59:59Z'),
        teamId: 'team-001',
        userId: 'user-001',
        yesterdayAccomplishments: 'Completed task A',
        todayPlan: 'Plan task B',
        currentIssues: 'Issue 1',
        submittedAt: new Date('2026-02-28T23:59:59Z'),
      },
      {
        reportId: 'report-month-start-early',
        createdAt: new Date('2026-03-01T00:00:00Z'),
        teamId: 'team-001',
        userId: 'user-001',
        yesterdayAccomplishments: 'Completed task B',
        todayPlan: 'Plan task C',
        currentIssues: 'Issue 2',
        submittedAt: new Date('2026-03-01T00:00:00Z'),
      },
      {
        reportId: 'report-month-start-late',
        createdAt: new Date('2026-03-01T23:59:59Z'),
        teamId: 'team-001',
        userId: 'user-001',
        yesterdayAccomplishments: 'Completed task C',
        todayPlan: 'Plan task D',
        currentIssues: 'Issue 3',
        submittedAt: new Date('2026-03-01T23:59:59Z'),
      },
    ];

    const result = extractMonthlyReportData({
      aggregationStartDate,
      aggregationEndDate,
      reportRecords,
    });

    expect(result.reportIds).toEqual(['report-month-start-early', 'report-month-start-late']);
    expect(result.reportIds).not.toContain('report-prev-day');
    expect(result.totalReportCount).toBe(2);
  });
});