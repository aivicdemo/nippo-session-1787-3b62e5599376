import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput, type DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  // SCEN-2344: [edge] 課題解決速度計算機能 - 複数件の課題データが同じ解決日数を持つとき、すべてが平均計算に含まれる
  test('should include all issues with identical resolution days in average calculation', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const teamId = 'team-001';

    // 解決日数が同じ値（5日）を持つ課題データを複数件（3件）作成
    const dailyReportRecords: DailyReportRecord[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-05T09:00:00Z'),
        teamId: teamId,
        reporterId: 'user-001',
        yesterdayAccomplishment: 'Completed module A',
        todayPlan: 'Start module B',
        issues: [
          {
            issueId: 'issue-001',
            reportedDate: new Date('2024-01-05T09:00:00Z'),
            resolvedDate: new Date('2024-01-10T18:00:00Z'),
            resolutionDays: 5,
            keywordId: 'keyword-001'
          }
        ]
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-10T09:00:00Z'),
        teamId: teamId,
        reporterId: 'user-002',
        yesterdayAccomplishment: 'Reviewed code',
        todayPlan: 'Testing phase',
        issues: [
          {
            issueId: 'issue-002',
            reportedDate: new Date('2024-01-10T09:00:00Z'),
            resolvedDate: new Date('2024-01-15T18:00:00Z'),
            resolutionDays: 5,
            keywordId: 'keyword-001'
          }
        ]
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        teamId: teamId,
        reporterId: 'user-003',
        yesterdayAccomplishment: 'Deployed to staging',
        todayPlan: 'Production release',
        issues: [
          {
            issueId: 'issue-003',
            reportedDate: new Date('2024-01-15T09:00:00Z'),
            resolvedDate: new Date('2024-01-20T18:00:00Z'),
            resolutionDays: 5,
            keywordId: 'keyword-001'
          }
        ]
      }
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: aggregationStartDate,
      aggregationEndDate: aggregationEndDate,
      teamIds: [teamId],
      reportDataset: dailyReportRecords
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    // 結果から対象チームのメトリクスを取得
    const teamMetric = result.teamMetrics.find(m => m.teamId === teamId);
    expect(teamMetric).toBeDefined();

    if (teamMetric) {
      // issueResolutionSpeed フィールドが平均解決日数を返却していることを確認
      // 3件すべてが5日なので、平均は5.0になる
      expect(teamMetric.issueResolutionSpeed).toBe(5.0);
    }

    // データ品質スコアが返却されていることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 集約期間が正しく記録されていることを確認
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
  });
});