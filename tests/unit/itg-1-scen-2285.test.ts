import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('calculateTeamPerformanceMetrics', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-2285
  test('should throw MissingAggregationEndDateError when aggregationEndDate is not specified', () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = null;
    const teamIds = ['team-001'];
    const reportDataset: DailyReportRecord[] = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        memberId: 'member-001',
        reportDate: new Date('2026-01-01T09:00:00Z'),
        yesterdayAccomplishments: 'Completed task A',
        todayPlans: 'Start task B',
        issues: 'No issues',
        submittedAt: new Date('2026-01-01T09:00:00Z'),
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate: aggregationEndDate as any,
      teamIds,
      reportDataset,
    };

    expect(() => {
      calculateTeamPerformanceMetrics(input);
    }).toThrow(/集約期間の終了日/);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ProductivityCalculator.calculate: endDate is required')
    );
  });
});