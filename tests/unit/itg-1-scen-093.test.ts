import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-analysis-report';
import { type MonthlyReportDataset, type MonthlyReport } from '../../src/logic/monthly-analysis-report';

describe('calculateTeamPerformanceMetrics', () => {
  // SCEN-093
  test('should throw InsufficientDataForMetricsCalculation error when team has fewer than 5 reports', () => {
    const teamIds = ['team-A', 'team-B'];
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');

    const reportDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z',
      },
      totalReportCount: 4,
      reports: [
        {
          reportId: 'report-001',
          reportDate: '2024-01-05',
          reporterId: 'engineer-001',
          teamId: 'team-A',
          issues: [],
          submissionTimestamp: '2024-01-05T08:00:00Z',
        },
        {
          reportId: 'report-002',
          reportDate: '2024-01-10',
          reporterId: 'engineer-002',
          teamId: 'team-A',
          issues: [],
          submissionTimestamp: '2024-01-10T08:00:00Z',
        },
        {
          reportId: 'report-003',
          reportDate: '2024-01-15',
          reporterId: 'engineer-003',
          teamId: 'team-A',
          issues: [],
          submissionTimestamp: '2024-01-15T08:00:00Z',
        },
        {
          reportId: 'report-004',
          reportDate: '2024-01-20',
          reporterId: 'engineer-004',
          teamId: 'team-A',
          issues: [],
          submissionTimestamp: '2024-01-20T08:00:00Z',
        },
      ],
      dataQualityScore: 75,
    };

    expect(() =>
      calculateTeamPerformanceMetrics(teamIds, aggregationStartDate, aggregationEndDate, reportDataset)
    ).toThrow(/team-A.*月次データが不足/);
  });
});