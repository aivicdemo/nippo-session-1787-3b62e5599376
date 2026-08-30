import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-557
  test('分析対象期間内のデータが不足しているときにエラーを発生させる', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-30T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = false;

    expect(() =>
      calculateProductivityMetrics(
        aggregationStartDate,
        aggregationEndDate,
        targetTeamIds,
        excludeOutliers
      )
    ).toThrow(/データ集約/);
  });
});