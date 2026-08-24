import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能 - 集約期間処理', () => {
  // SCEN-2296
  test('集約期間の開始日が月初となる場合、期間の最初のデータが正しく含まれる', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-02T23:59:59Z');
    const teamId = 'team-001';

    const reportDataset = [
      {
        recordDate: new Date('2024-01-01T09:30:00Z'),
        reporterId: 'user-001',
        yesterdayAccomplishment: 'タスクA完了',
        todayPlan: 'タスクB開始',
        issuesContent: 'なし',
        issueCount: 0,
        productivityScore: 85,
        reportSubmitted: true,
      },
      {
        recordDate: new Date('2024-01-02T09:30:00Z'),
        reporterId: 'user-001',
        yesterdayAccomplishment: 'タスクB進行中',
        todayPlan: 'タスクB継続',
        issuesContent: 'リソース不足',
        issueCount: 1,
        productivityScore: 90,
        reportSubmitted: true,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds: [teamId],
      reportRecords: reportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.dayCount).toBe(2);

    expect(result.teamMetrics).toHaveLength(1);
    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.teamId).toBe(teamId);

    const includedRecords = result.teamMetrics[0];
    expect(includedRecords).toBeDefined();

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    const jan01Data = reportDataset.find(
      (record) => record.recordDate.toISOString().startsWith('2024-01-01')
    );
    expect(jan01Data).toBeDefined();
    expect(jan01Data?.productivityScore).toBe(85);
  });
});