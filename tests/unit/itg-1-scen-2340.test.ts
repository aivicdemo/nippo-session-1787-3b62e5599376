import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';

describe('Team Performance Metrics Calculation', () => {
  test('SCEN-2340: 課題解決速度計算機能 - 解決日数の計算で端数が発生するとき、小数点以下を正しく丸める', () => {
    // Arrange: テストデータを準備
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const teamIds = ['team-001'];

    // テスト対象シナリオ: 解決済み課題数=3件、解決に要した総日数=15日
    // 期待される計算: 15日÷3件 = 5.0日
    const reportDataset = [
      {
        recordDate: new Date('2024-01-10T09:00:00Z'),
        teamId: 'team-001',
        reporterId: 'engineer-001',
        yesterdayAccomplishments: 'タスク A 完了',
        todayPlans: 'タスク B 開始',
        issues: '課題 1 解決（報告日 2024-01-05、解決日 2024-01-10、経過日数 5日）',
        encryptionStatus: 'encrypted',
      },
      {
        recordDate: new Date('2024-01-15T09:00:00Z'),
        teamId: 'team-001',
        reporterId: 'engineer-002',
        yesterdayAccomplishments: 'タスク C 完了',
        todayPlans: 'タスク D 開始',
        issues: '課題 2 解決（報告日 2024-01-08、解決日 2024-01-15、経過日数 7日）',
        encryptionStatus: 'encrypted',
      },
      {
        recordDate: new Date('2024-01-20T09:00:00Z'),
        teamId: 'team-001',
        reporterId: 'engineer-003',
        yesterdayAccomplishments: 'タスク E 完了',
        todayPlans: 'タスク F 開始',
        issues: '課題 3 解決（報告日 2024-01-13、解決日 2024-01-20、経過日数 3日）',
        encryptionStatus: 'encrypted',
      },
    ];

    const input = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset,
    };

    // Act: 関数を実行
    const result = calculateTeamPerformanceMetrics(input);

    // Assert: 計算結果の検証
    // 期待値: 課題解決速度 = (5 + 7 + 3) ÷ 3 = 15 ÷ 3 = 5.0日
    // 丸め規則を適用: 小数点第1位まで = 5.0
    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find((m) => m.teamId === 'team-001');
    expect(teamMetric).toBeDefined();

    // 課題解決速度が 5.0 日となることを検証
    expect(teamMetric.issueResolutionSpeed).toBe(5.0);

    // データ品質スコアが 0 ～ 100 の範囲内であることを検証
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 集約期間が正しく記録されていることを検証
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
  });
});