import { aggregateReportsByPeriod } from "../../src/logic/report-data-aggregation";

describe("Report Data Aggregation - aggregateReportsByPeriod", () => {
  test("SCEN-377: should throw error when analysis period is zero or less days", () => {
    const startDate = new Date("2024-01-15T00:00:00Z");
    const endDate = new Date("2024-01-15T00:00:00Z");
    const periodType = "daily";
    const targetTeamIds: string[] = [];
    const includeArchivedReports = false;

    const request = {
      startDate,
      endDate,
      periodType,
      targetTeamIds,
      includeArchivedReports,
    };

    expect(() => aggregateReportsByPeriod(request)).toThrow(
      /分析対象期間は1日以上である必要があります/
    );
  });
});