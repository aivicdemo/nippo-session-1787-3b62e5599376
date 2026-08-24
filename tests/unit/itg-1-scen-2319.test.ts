import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 課題解決速度定量計算', () => {
  // SCEN-2319: [normal] 課題解決速度の定量計算機能 - 同じ入力データで2回実行した場合、課題解決日数と対応完了率が同一の値として計算される
  test('同一入力で複数回実行時、課題解決速度の計算結果が同一であること', () => {
    const aggregationStartDate = new Date('2026-08-20T00:00:00Z');
    const aggregationEndDate = new Date('2026-08-25T23:59:59Z');
    const targetTeamId = 'team-001';

    const reportDataset = [
      {
        reportId: 'report-001',
        teamId: targetTeamId,
        reportedDate: new Date('2026-08-20T09:00:00Z'),
        issueId: 'issue-db-connection',
        issueKeyword: 'データベース接続エラー',
        impactScore: 85,
        resolutionStatus: 'resolved' as const,
        resolvedDate: new Date('2026-08-25T15:30:00Z'),
      },
    ];

    const metricsInput: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds: [targetTeamId],
      reportDataset,
    };

    const firstExecutionResult = calculateTeamPerformanceMetrics(metricsInput);

    const firstResolutionMetrics = firstExecutionResult.teamMetrics[0];
    const firstResolutionDays = firstResolutionMetrics.issueResolutionSpeed;
    const firstSubmissionRate = firstResolutionMetrics.reportSubmissionRate;

    const secondExecutionResult = calculateTeamPerformanceMetrics(metricsInput);

    const secondResolutionMetrics = secondExecutionResult.teamMetrics[0];
    const secondResolutionDays = secondResolutionMetrics.issueResolutionSpeed;
    const secondSubmissionRate = secondResolutionMetrics.reportSubmissionRate;

    expect(firstResolutionDays).toBe(5);
    expect(secondResolutionDays).toBe(5);
    expect(firstResolutionDays).toEqual(secondResolutionDays);

    expect(firstSubmissionRate).toBe(100);
    expect(secondSubmissionRate).toBe(100);
    expect(firstSubmissionRate).toEqual(secondSubmissionRate);

    expect(firstExecutionResult.dataQualityScore).toBe(secondExecutionResult.dataQualityScore);
    expect(firstExecutionResult.aggregationPeriod.startDate).toEqual(secondExecutionResult.aggregationPeriod.startDate);
    expect(firstExecutionResult.aggregationPeriod.endDate).toEqual(secondExecutionResult.aggregationPeriod.endDate);
  });
});