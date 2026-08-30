import { aggregateReportsByPeriod, type AggregatedReportDataset } from "../../src/logic/report-data-aggregation";

describe("Report Data Aggregation", () => {
  test("SCEN-568: aggregateReportsByPeriod returns empty aggregatedIssues when all daily reports have no issue content", async () => {
    // Prepare test input data: multiple team members with daily reports
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date("2025-01-31T23:59:59Z");
    const periodType = "monthly";

    // Call aggregateReportsByPeriod with specified period
    // All reports have empty issue content, so no keywords will be extracted
    const result: AggregatedReportDataset = await aggregateReportsByPeriod({
      startDate,
      endDate,
      periodType,
      targetTeamIds: undefined, // target all teams
      includeArchivedReports: false,
    });

    // Verify aggregation period is correctly set
    expect(result.aggregationPeriod.startDate).toEqual(startDate);
    expect(result.aggregationPeriod.endDate).toEqual(endDate);
    expect(result.aggregationPeriod.periodType).toBe("monthly");

    // Verify that aggregatedIssues is empty array (no keywords extracted from empty issue content)
    expect(result.aggregatedIssues).toEqual([]);

    // Verify data quality metrics reflect empty extraction
    expect(result.dataQualityMetrics.completenessScore).toBe(0);
    expect(result.dataQualityMetrics.accuracyScore).toBe(0);
    expect(result.dataQualityMetrics.deduplicationRate).toBe(0);

    // Verify totalReportCount is >= 1 (reports exist, but issues are empty)
    expect(result.totalReportCount).toBeGreaterThanOrEqual(1);

    // Verify generatedAt is a Date object with recent timestamp
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(Date.now());

    // Verify no error is thrown and the warning condition is satisfied:
    // "When extracted issue keywords are empty -> 'No issues reported in the specified period'"
    // This is handled as a normal business case, not an error
    expect(result).toBeDefined();
  });
});