import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput, DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次チームパフォーマンス分析', () => {
  // SCEN-2316: [normal] 課題解決速度の定量計算機能 - 指定期間内で全ての課題が解決済みの場合、対応完了率が100%として計算される
  test('指定期間内の全課題が解決済みの場合、対応完了率は100%と計算される', () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59Z');
    const teamIds = ['team-001'];

    const reportRecords: DailyReportRecord[] = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        reportDate: new Date('2026-01-05T09:00:00Z'),
        yesterdayAccomplishment: 'タスクA完了',
        todayPlan: 'タスクB開始',
        issues: 'システムレイテンシ検出',
        issueSummary: 'Issue-001: システムレイテンシ',
        reportedAt: new Date('2026-01-05T08:30:00Z'),
        submittedWithinDeadline: true,
      },
      {
        reportId: 'report-002',
        teamId: 'team-001',
        reportDate: new Date('2026-01-06T09:00:00Z'),
        yesterdayAccomplishment: 'タスクB進行中',
        todayPlan: 'タスクC実施',
        issues: 'データベース接続エラー',
        issueSummary: 'Issue-002: DB接続エラー',
        reportedAt: new Date('2026-01-06T08:30:00Z'),
        submittedWithinDeadline: true,
      },
      {
        reportId: 'report-003',
        teamId: 'team-001',
        reportDate: new Date('2026-01-10T09:00:00Z'),
        yesterdayAccomplishment: 'タスクC完了',
        todayPlan: 'テスト開始',
        issues: 'テストカバレッジ不足',
        issueSummary: 'Issue-003: テストカバレッジ不足',
        reportedAt: new Date('2026-01-10T08:30:00Z'),
        submittedWithinDeadline: true,
      },
      {
        reportId: 'report-004',
        teamId: 'team-001',
        reportDate: new Date('2026-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'ユニットテスト実施',
        todayPlan: '統合テスト実施',
        issues: 'CI/CDパイプライン遅延',
        issueSummary: 'Issue-004: CI/CD遅延',
        reportedAt: new Date('2026-01-15T08:30:00Z'),
        submittedWithinDeadline: true,
      },
      {
        reportId: 'report-005',
        teamId: 'team-001',
        reportDate: new Date('2026-01-20T09:00:00Z'),
        yesterdayAccomplishment: '統合テスト完了',
        todayPlan: 'リリース準備',
        issues: 'ドキュメント未完成',
        issueSummary: 'Issue-005: ドキュメント未完成',
        reportedAt: new Date('2026-01-20T08:30:00Z'),
        submittedWithinDeadline: true,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: reportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    // 検証: チーム別メトリクスが返されること
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBe(1);

    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.teamId).toBe('team-001');

    // 検証: 対応完了率が100.0%として計算されること
    // 計算ロジック: 指定期間内の解決済み課題数 ÷ 指定期間内の全課題数 × 100 = 5 ÷ 5 × 100 = 100.0
    expect(teamMetric.reportSubmissionRate).toBe(100.0);

    // 検証: 集約期間が正しく記録されていること
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    // 検証: データ品質スコアが数値であること（0～100の範囲内）
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 検証: 異常値検出結果が存在すること
    expect(result.outlierDetectionResult).toBeDefined();
  });
});