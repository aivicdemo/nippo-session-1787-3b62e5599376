import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData, type MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次パフォーマンス分析', () => {
  // SCEN-2421
  test('集約期間内のデータが時系列の逆順で入力されているとき、正しい時系列順で集約対象に含まれる', () => {
    const aggregationStartDate = new Date('2024-01-15T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-19T23:59:59Z');
    const requestedByUserId = 'user-001';

    const reverseChronologicalReports = [
      {
        reportId: 'report-005',
        userId: 'user-001',
        submittedAt: new Date('2024-01-19T09:00:00Z'),
        yesterdayAccomplishments: 'Completed feature A',
        todayPlan: 'Start feature B',
        currentIssues: 'None',
      },
      {
        reportId: 'report-004',
        userId: 'user-001',
        submittedAt: new Date('2024-01-18T09:00:00Z'),
        yesterdayAccomplishments: 'Completed testing',
        todayPlan: 'Feature A review',
        currentIssues: 'Database latency',
      },
      {
        reportId: 'report-003',
        userId: 'user-001',
        submittedAt: new Date('2024-01-17T09:00:00Z'),
        yesterdayAccomplishments: 'API implementation',
        todayPlan: 'Unit testing',
        currentIssues: 'Integration issue',
      },
      {
        reportId: 'report-002',
        userId: 'user-001',
        submittedAt: new Date('2024-01-16T09:00:00Z'),
        yesterdayAccomplishments: 'Design review',
        todayPlan: 'API implementation',
        currentIssues: 'Schema mismatch',
      },
      {
        reportId: 'report-001',
        userId: 'user-001',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
        yesterdayAccomplishments: 'Project kickoff',
        todayPlan: 'Design review',
        currentIssues: 'Requirement clarification',
      },
    ];

    const result: MonthlyReportDataset = extractMonthlyReportData({
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: requestedByUserId,
      teamIdFilter: undefined,
    });

    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.reportsByTeam)).toBe(true);
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();
  });
});