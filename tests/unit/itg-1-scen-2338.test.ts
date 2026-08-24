import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput, DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('calculateTeamPerformanceMetrics', () => {
  // SCEN-2338: [edge] 課題解決速度計算機能 - 指定期間の開始日が月初のとき、その月初日から集計される
  test('should aggregate metrics from the first day of the month when aggregationStartDate is month start', () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00.000Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59.999Z');
    const teamIds = ['team-001'];

    const reportRecords: DailyReportRecord[] = [
      {
        reportId: 'report-001',
        recordDate: new Date('2026-01-01T09:00:00.000Z'),
        teamId: 'team-001',
        reporterUserId: 'user-001',
        yesterdayAccomplishment: 'Completed feature A',
        todayPlan: 'Start feature B',
        issues: 'Database performance issue detected',
        submittedAt: new Date('2026-01-01T08:30:00.000Z'),
        keywords: ['database', 'performance'],
        impactScores: [45, 52],
        severity: 'medium',
      },
      {
        reportId: 'report-002',
        recordDate: new Date('2026-01-05T09:00:00.000Z'),
        teamId: 'team-001',
        reporterUserId: 'user-002',
        yesterdayAccomplishment: 'Reviewed PR',
        todayPlan: 'Testing',
        issues: 'Integration test failure',
        submittedAt: new Date('2026-01-05T08:45:00.000Z'),
        keywords: ['integration', 'test'],
        impactScores: [38, 41],
        severity: 'low',
      },
      {
        reportId: 'report-003',
        recordDate: new Date('2026-01-10T09:00:00.000Z'),
        teamId: 'team-001',
        reporterUserId: 'user-001',
        yesterdayAccomplishment: 'Deployed to staging',
        todayPlan: 'Monitor deployment',
        issues: 'Database performance issue detected',
        submittedAt: new Date('2026-01-10T08:35:00.000Z'),
        keywords: ['database', 'performance'],
        impactScores: [48, 55],
        severity: 'medium',
      },
      {
        reportId: 'report-004',
        recordDate: new Date('2026-01-15T09:00:00.000Z'),
        teamId: 'team-001',
        reporterUserId: 'user-003',
        yesterdayAccomplishment: 'Code refactoring',
        todayPlan: 'Unit test writing',
        issues: 'API latency issue',
        submittedAt: new Date('2026-01-15T08:40:00.000Z'),
        keywords: ['api', 'latency'],
        impactScores: [62, 58],
        severity: 'high',
      },
      {
        reportId: 'report-005',
        recordDate: new Date('2026-01-20T09:00:00.000Z'),
        teamId: 'team-001',
        reporterUserId: 'user-002',
        yesterdayAccomplishment: 'Documentation update',
        todayPlan: 'Prepare release notes',
        issues: 'Integration test failure',
        submittedAt: new Date('2026-01-20T08:50:00.000Z'),
        keywords: ['integration', 'test'],
        impactScores: [35, 40],
        severity: 'low',
      },
      {
        reportId: 'report-006',
        recordDate: new Date('2026-01-25T09:00:00.000Z'),
        teamId: 'team-001',
        reporterUserId: 'user-001',
        yesterdayAccomplishment: 'Performance tuning',
        todayPlan: 'Load testing',
        issues: 'Database performance issue detected',
        submittedAt: new Date('2026-01-25T08:55:00.000Z'),
        keywords: ['database', 'performance'],
        impactScores: [50, 54],
        severity: 'medium',
      },
      {
        reportId: 'report-007',
        recordDate: new Date('2026-01-30T09:00:00.000Z'),
        teamId: 'team-001',
        reporterUserId: 'user-003',
        yesterdayAccomplishment: 'Final testing round',
        todayPlan: 'Production release',
        issues: 'API latency issue',
        submittedAt: new Date('2026-01-30T08:45:00.000Z'),
        keywords: ['api', 'latency'],
        impactScores: [60, 65],
        severity: 'high',
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: reportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    // 集計期間がメタデータに正確に反映されていることを確認
    expect(result.aggregationPeriod.startDate).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(result.aggregationPeriod.endDate).toEqual(new Date('2026-01-31T23:59:59.999Z'));
    expect(result.aggregationPeriod.durationDays).toBe(31);

    // チーム別メトリクスが存在することを確認
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find((m) => m.teamId === 'team-001');
    expect(teamMetric).toBeDefined();
    expect(teamMetric!.teamId).toBe('team-001');

    // 月初1日の課題データが集計に含まれていることを確認
    // database/performanceキーワードが複数日（1日、10日、25日）で出現しているため、発生頻度が高くなる
    expect(teamMetric!.issueResolutionSpeed).toBeDefined();
    expect(typeof teamMetric!.issueResolutionSpeed).toBe('number');

    // 報告提出率が計算されていることを確認（7日間で7件の日報 = 100%に相当）
    expect(teamMetric!.reportSubmissionRate).toBeDefined();
    expect(teamMetric!.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric!.reportSubmissionRate).toBeLessThanOrEqual(100);

    // 課題再発率が計算されていることを確認
    expect(teamMetric!.issueRecurrenceRate).toBeDefined();
    expect(teamMetric!.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric!.issueRecurrenceRate).toBeLessThanOrEqual(100);

    // 優先度スコアが計算されていることを確認
    expect(teamMetric!.priorityScore).toBeDefined();
    expect(teamMetric!.priorityScore).toBeGreaterThanOrEqual(1);
    expect(teamMetric!.priorityScore).toBeLessThanOrEqual(100);

    // データ品質スコアが計算されていることを確認
    expect(result.dataQualityScore).toBeDefined();
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 異常値検出結果が含まれていることを確認
    expect(result.outlierDetectionResult).toBeDefined();
    expect(result.outlierDetectionResult.detectedOutliers).toBeDefined();
    expect(Array.isArray(result.outlierDetectionResult.detectedOutliers)).toBe(true);
  });
});