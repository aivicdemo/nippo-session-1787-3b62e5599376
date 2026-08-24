import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('チーム別パフォーマンス指標集計機能 - 小数丸め処理', () => {
  // SCEN-1831
  test('パフォーマンス指標の計算で小数が発生する場合、丸め処理が正確に適用される', () => {
    const aggregationStartDate = new Date('2024-01-01');
    const aggregationEndDate = new Date('2024-01-31');
    const teamId = 'team-001';

    const reportDataset = [
      {
        reportId: 'report-001',
        teamId: teamId,
        reportDate: new Date('2024-01-15'),
        submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
        reportStatus: 'submitted' as const,
        yesterdayAccomplishment: 'Task A completed',
        todayPlan: 'Task B planned',
        challengeDescription: 'Challenge 1',
        submissionDelayMinutes: 0,
      },
      {
        reportId: 'report-002',
        teamId: teamId,
        reportDate: new Date('2024-01-16'),
        submissionTimestamp: new Date('2024-01-16T08:30:00Z'),
        reportStatus: 'submitted' as const,
        yesterdayAccomplishment: 'Task B completed',
        todayPlan: 'Task C planned',
        challengeDescription: 'Challenge 2',
        submissionDelayMinutes: 0,
      },
      {
        reportId: 'report-003',
        teamId: teamId,
        reportDate: new Date('2024-01-17'),
        submissionTimestamp: new Date('2024-01-17T09:15:00Z'),
        reportStatus: 'submitted' as const,
        yesterdayAccomplishment: 'Task C completed',
        todayPlan: 'Task D planned',
        challengeDescription: 'Challenge 3',
        submissionDelayMinutes: 45,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: aggregationStartDate,
      aggregationEndDate: aggregationEndDate,
      teamIds: [teamId],
      reportRecords: reportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find((m) => m.teamId === teamId);
    expect(teamMetric).toBeDefined();

    if (teamMetric) {
      expect(teamMetric.reportSubmissionRate).toBe(100);

      expect(teamMetric.issueResolutionSpeed).toBeGreaterThanOrEqual(0);

      expect(teamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
      expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);

      expect(teamMetric.priorityScore).toBeGreaterThanOrEqual(1);
      expect(teamMetric.priorityScore).toBeLessThanOrEqual(100);

      const reportCompletionRateScenarioA = 2 / 3;
      const expectedReportCompletionRateA = Math.floor(reportCompletionRateScenarioA * 100) / 100;
      expect(expectedReportCompletionRateA).toBe(0.66);

      const issueResolutionAverageScenarioB = 155 / 3;
      const expectedIssueResolutionAverageB = Math.round(issueResolutionAverageScenarioB * 100) / 100;
      expect(expectedIssueResolutionAverageB).toBe(51.67);

      const reportDelayRateScenarioC = 1 / 6;
      const expectedReportDelayRateC = Math.round(reportDelayRateScenarioC * 10000) / 10000;
      expect(expectedReportDelayRateC).toBe(0.1667);
    }

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
  });
});