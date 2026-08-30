import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム', () => {
  // SCEN-597
  test('指定された集約期間内の日報データから課題解決速度、提出率、課題再発率を定量化し、生産性指標を計算する - 計測開始日が計測終了日より後の日付のときという明示された境界条件で計測期間の日付が不正です。開始日は終了日より前である必要があります', () => {
    const aggregationStartDate = new Date('2026-08-20T00:00:00Z');
    const aggregationEndDate = new Date('2026-08-19T00:00:00Z');
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