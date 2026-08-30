import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-102
  test('集約期間が30日未満、または開始日が終了日より後の場合、InvalidAggregationPeriodErrorをスロー', () => {
    const aggregationEndDate = new Date('2024-01-01T00:00:00Z');
    const aggregationStartDate = new Date('2024-01-15T00:00:00Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = false;

    const input = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    };

    expect(() => calculateProductivityMetrics(input)).toThrow(/集約期間は30日以上で、開始日が終了日以前である必要があります/);
  });
});