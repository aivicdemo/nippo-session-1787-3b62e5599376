import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics, type TeamPerformanceMetricsInput, type MonthlyReportDataset } from '../../src/logic/monthly-analysis-report';

describe('calculateTeamPerformanceMetrics', () => {
  // SCEN-095
  test('should throw DateRangeValidationError when aggregationStartDate is after aggregationEndDate', () => {
    const teamIds = ['team-001', 'team-002'];
    const aggregationStartDate = new Date('2024-02-29T00:00:00Z');
    const aggregationEndDate = new Date('2024-02-15T23:59:59Z');
    
    const reportDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-02-01T00:00:00Z',
        endDateTime: '2024-02-29T23:59:59Z',
      },
      totalReportCount: 10,
      reports: [],
      dataQualityScore: 95,
    };

    const input: TeamPerformanceMetricsInput = {
      teamIds,
      aggregationStartDate,
      aggregationEndDate,
      reportDataset,
    };

    expect(() => calculateTeamPerformanceMetrics(input)).toThrow(/集計期間の開始日/);
  });
});