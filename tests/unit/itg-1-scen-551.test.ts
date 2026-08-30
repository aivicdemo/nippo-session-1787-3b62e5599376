import { calculateProductivityMetrics } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム - 生産性指標計算", () => {
  test("SCEN-551: 集約期間の開始日が終了日より後のとき、InvalidAggregationPeriodErrorが発生すること", () => {
    const aggregationStartDate = new Date("2024-01-31");
    const aggregationEndDate = new Date("2024-01-01");
    const targetTeamIds = ["team-001"];
    const excludeOutliers = false;

    expect(() =>
      calculateProductivityMetrics({
        aggregationStartDate,
        aggregationEndDate,
        targetTeamIds,
        excludeOutliers,
      })
    ).toThrow(/集約期間は30日以上で、開始日が終了日以前である必要があります/);
  });
});