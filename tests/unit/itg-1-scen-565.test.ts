import { describe, test, expect } from "@jest/globals";
import { aggregateReportsByPeriod } from "../../src/logic/report-data-aggregation";

describe("report-data-aggregation", () => {
  test("SCEN-565: should throw InvalidAggregationPeriodError when startDate is after endDate", () => {
    const request = {
      startDate: new Date("2024-01-31T00:00:00Z"),
      endDate: new Date("2024-01-30T00:00:00Z"),
      periodType: "daily" as const,
      targetTeamIds: undefined,
      includeArchivedReports: false,
    };

    expect(() => aggregateReportsByPeriod(request)).toThrow(
      /集約期間が無効です。開始日は終了日以前である必要があります。/
    );
  });
});