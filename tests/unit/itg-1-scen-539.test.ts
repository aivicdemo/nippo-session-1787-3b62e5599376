import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-539
  test('集約期間の開始日が終了日より後の場合、エラーが発生する', () => {
    const aggregationStartDate = new Date('2024-01-31T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-01T00:00:00Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = false;

    expect(() =>
      calculateProductivityMetrics({
        aggregationStartDate,
        aggregationEndDate,
        targetTeamIds,
        excludeOutliers,
      })
    ).toThrow(/集約期間/);
  });
});