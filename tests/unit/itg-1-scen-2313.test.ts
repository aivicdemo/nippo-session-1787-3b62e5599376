import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput, type DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis', () => {
  // SCEN-2313: [normal] 課題解決速度の定量計算機能 - 指定期間内の日報複数件から課題解決日数の平均値と対応完了率が正しく集計される
  it('should calculate average resolution days and completion rate correctly from multiple reports within specified period', () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59Z');
    const teamId = 'team-123';
    const teamName = 'Development Team';

    const reportRecords: DailyReportRecord[] = [
      {
        reportId: 'report-001',
        teamId: teamId,
        userId: 'user-001',
        reportDate: new Date('2026-01-05T09:00:00Z'),
        yesterdayAccomplishment: 'API implementation',
        todayPlan: 'Testing API response',
        issues: [
          {
            issueId: 'issue-001',
            title: 'APIのレスポンス遅延',
            description: 'API response time exceeds 5 seconds',
            reportedDate: new Date('2026-01-01T09:00:00Z'),
            resolvedDate: new Date('2026-01-06T17:00:00Z'),
            isResolved: true,
          },
        ],
      },
      {
        reportId: 'report-002',
        teamId: teamId,
        userId: 'user-001',
        reportDate: new Date('2026-01-10T09:00:00Z'),
        yesterdayAccomplishment: 'DB query optimization',
        todayPlan: 'Performance testing',
        issues: [
          {
            issueId: 'issue-002',
            title: 'DBクエリ最適化',
            description: 'Database query performance needs improvement',
            reportedDate: new Date('2026-01-02T09:00:00Z'),
            resolvedDate: new Date('2026-01-10T17:00:00Z'),
            isResolved: true,
          },
        ],
      },
      {
        reportId: 'report-003',
        teamId: teamId,
        userId: 'user-001',
        reportDate: new Date('2026-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'Log system debugging',
        todayPlan: 'Deploy fix',
        issues: [
          {
            issueId: 'issue-003',
            title: 'ログシステムエラー',
            description: 'Log system throwing errors intermittently',
            reportedDate: new Date('2026-01-12T09:00:00Z'),
            resolvedDate: new Date('2026-01-15T17:00:00Z'),
            isResolved: false,
          },
        ],
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds: [teamId],
      reportDataset: reportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBe(1);

    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.teamId).toBe(teamId);
    expect(teamMetric.teamName).toBe(teamName);

    // 計算根拠: (5 + 8 + 3) / 3 = 16 / 3 = 5.33 (小数第2位四捨五入)
    expect(teamMetric.issueResolutionSpeed).toBeCloseTo(5.33, 2);

    // 計算根拠: 完了2件 / 全3件 = 0.6667 * 100 = 66.67%
    expect(teamMetric.reportSubmissionRate).toBeCloseTo(66.67, 2);

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    expect(result.dataQualityScore).toBeDefined();
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
  });
});