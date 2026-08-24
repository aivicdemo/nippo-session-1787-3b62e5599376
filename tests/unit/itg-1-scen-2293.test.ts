import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能', () => {
  // SCEN-2293: [error] 生産性指標計算機能 - 集約期間が負の値または0日以下のとき、エラーが発生する
  test('集約期間が0日以下の場合、InvalidAggregationPeriodErrorが発生する', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-01T00:00:00Z');
    const teamIds = ['team-001'];
    const reportDataset: any[] = [];

    // 集約期間が0日の場合
    expect(() =>
      calculateTeamPerformanceMetrics({
        aggregationStartDate,
        aggregationEndDate,
        teamIds,
        reportDataset,
      })
    ).toThrow(/集約期間は1日以上の正の整数で指定してください/);

    // 集約期間が負の値（開始日が終了日より後）の場合
    const negativeAggregationStartDate = new Date('2024-01-10T00:00:00Z');
    const negativeAggregationEndDate = new Date('2024-01-05T00:00:00Z');

    expect(() =>
      calculateTeamPerformanceMetrics({
        aggregationStartDate: negativeAggregationStartDate,
        aggregationEndDate: negativeAggregationEndDate,
        teamIds,
        reportDataset,
      })
    ).toThrow(/集約期間は1日以上の正の整数で指定してください/);
  });
});