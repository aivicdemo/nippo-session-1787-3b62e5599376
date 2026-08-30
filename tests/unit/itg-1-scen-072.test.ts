import { describe, test, expect, beforeEach } from "@jest/globals";
import { aggregateReportsByPeriod } from "../../src/logic/report-data-aggregation";

describe("aggregateReportsByPeriod", () => {
  // SCEN-072: [error] 指定された期間の開始日が終了日より後、または期間が0日である場合、InvalidAggregationPeriodErrorがスローされる
  test("should throw InvalidAggregationPeriodError when startDate is after endDate", () => {
    const invalidStartDate = new Date("2026-01-15T00:00:00Z");
    const invalidEndDate = new Date("2026-01-10T00:00:00Z");
    const periodType = "daily";

    expect(() =>
      aggregateReportsByPeriod(
        invalidStartDate,
        invalidEndDate,
        periodType,
        undefined,
        false
      )
    ).toThrow(/集約期間が無効です。開始日は終了日以前である必要があります。/);
  });

  test("should throw InvalidAggregationPeriodError when startDate equals endDate (zero-length period)", () => {
    const sameDate = new Date("2026-01-15T00:00:00Z");
    const periodType = "daily";

    expect(() =>
      aggregateReportsByPeriod(sameDate, sameDate, periodType, undefined, false)
    ).toThrow(/集約期間が無効です。開始日は終了日以前である必要があります。/);
  });
});