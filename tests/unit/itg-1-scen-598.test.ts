import { calculateProductivityMetrics, type ProductivityMetricsInput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-598
  test('チームメンバーIDの配列が空のとき、エラーを投げる', () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const today = new Date();

    const input: ProductivityMetricsInput = {
      aggregationStartDate: thirtyDaysAgo,
      aggregationEndDate: today,
      targetTeamIds: [],
      excludeOutliers: false,
    };

    expect(() => calculateProductivityMetrics(input)).toThrow(/チームメンバー/);
  });
});