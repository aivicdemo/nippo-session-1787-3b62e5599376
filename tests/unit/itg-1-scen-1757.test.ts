import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-1757: [normal] 月次レポート生成データ抽出機能 - 前月1日00:00から前月末日23:59までの全報告データが正しく抽出される
  test('should extract exactly report data within the previous month boundary (00:00 to 23:59)', () => {
    const currentDate = new Date('2024-02-15T10:30:00Z');
    const previousMonth = 1;
    const previousYear = 2024;

    const extractionPeriodStart = new Date(`${previousYear}-${String(previousMonth).padStart(2, '0')}-01T00:00:00Z`);
    const extractionPeriodEnd = new Date(`${previousYear}-${String(previousMonth + 1).padStart(2, '0')}-01T00:00:00Z`);
    extractionPeriodEnd.setMilliseconds(extractionPeriodEnd.getMilliseconds() - 1000);

    const reportRecords = [
      {
        reportId: 'report_001',
        submittedAt: new Date('2024-01-05T14:30:00Z'),
        reportText: 'Yesterday completed feature A. Today planning feature B. Issue: database connection timeout',
      },
      {
        reportId: 'report_002',
        submittedAt: new Date('2024-01-10T09:15:00Z'),
        reportText: 'Completed unit tests. Pending code review. Issue: test coverage low',
      },
      {
        reportId: 'report_003',
        submittedAt: new Date('2024-01-15T11:45:00Z'),
        reportText: 'Deployed to staging. Monitoring performance. Issue: API response time high',
      },
      {
        reportId: 'report_004',
        submittedAt: new Date('2024-01-20T16:20:00Z'),
        reportText: 'Merged PR to main. Wrote documentation. Issue: documentation incomplete',
      },
      {
        reportId: 'report_005',
        submittedAt: new Date('2024-01-25T13:00:00Z'),
        reportText: 'Fixed critical bug in payment module. Issue: similar bug in billing',
      },
      {
        reportId: 'report_006',
        submittedAt: new Date('2024-01-28T08:30:00Z'),
        reportText: 'Code optimization completed. Issue: memory usage still high',
      },
      {
        reportId: 'report_007',
        submittedAt: new Date('2024-01-31T23:45:00Z'),
        reportText: 'Final preparations for release. Issue: last-minute bug found',
      },
      {
        reportId: 'report_008',
        submittedAt: new Date('2024-01-12T14:15:00Z'),
        reportText: 'Meeting with stakeholders. Issue: requirement clarification needed',
      },
      {
        reportId: 'report_009',
        submittedAt: new Date('2024-01-22T10:00:00Z'),
        reportText: 'Refactoring legacy code. Issue: backward compatibility concern',
      },
      {
        reportId: 'report_010',
        submittedAt: new Date('2024-01-18T15:30:00Z'),
        reportText: 'Integration testing. Issue: third-party API integration failing',
      },
      {
        reportId: 'report_before_period',
        submittedAt: new Date('2023-12-31T23:59:59Z'),
        reportText: 'Data before extraction period. Should be excluded.',
      },
      {
        reportId: 'report_after_period',
        submittedAt: new Date('2024-02-01T00:00:00Z'),
        reportText: 'Data after extraction period. Should be excluded.',
      },
    ];

    const result = extractMonthlyReportData({
      targetYear: previousYear,
      targetMonth: previousMonth,
      requestedByUserId: 'user_manager_001',
    });

    expect(result.totalReportCount).toBe(10);

    const beforePeriodReport = result.allReports?.find(
      (r) => r.reportId === 'report_before_period'
    );
    expect(beforePeriodReport).toBeUndefined();

    const afterPeriodReport = result.allReports?.find(
      (r) => r.reportId === 'report_after_period'
    );
    expect(afterPeriodReport).toBeUndefined();

    if (result.allReports) {
      result.allReports.forEach((report) => {
        const submittedTimestamp = new Date(report.submittedAt).getTime();
        const startTimestamp = extractionPeriodStart.getTime();
        const endTimestamp = extractionPeriodEnd.getTime();

        expect(submittedTimestamp).toBeGreaterThanOrEqual(startTimestamp);
        expect(submittedTimestamp).toBeLessThanOrEqual(endTimestamp);
      });
    }

    expect(result.extractionPeriodStart).toBe(extractionPeriodStart.toISOString());
    expect(result.extractionPeriodEnd).toBe(extractionPeriodEnd.toISOString());

    const allExtractedIds = result.allReports?.map((r) => r.reportId) || [];
    const expectedIds = [
      'report_001',
      'report_002',
      'report_003',
      'report_004',
      'report_005',
      'report_006',
      'report_007',
      'report_008',
      'report_009',
      'report_010',
    ];
    expectedIds.forEach((expectedId) => {
      expect(allExtractedIds).toContain(expectedId);
    });
  });
});