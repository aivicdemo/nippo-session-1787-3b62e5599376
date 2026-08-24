import { analyzeBottleneckTrendWithTimeSeries } from "../../src/logic/monthly-performance-analysis";

describe("ボトルネック推移集計機能", () => {
  test("SCEN-1828: 波及度スコア49.9の課題が低程度ボトルネックに分類される", () => {
    const analysisStartDate = new Date("2024-01-01T00:00:00Z");
    const analysisEndDate = new Date("2024-01-31T23:59:59Z");

    const issueTimeSeriesData = [
      {
        issueId: "issue-001",
        recordDate: new Date("2024-01-15"),
        occurrenceCount: 3,
        impactScore: 49.9,
        resolutionDaysElapsed: 5,
        resolutionStatus: "open" as const,
      },
      {
        issueId: "issue-001",
        recordDate: new Date("2024-01-16"),
        occurrenceCount: 2,
        impactScore: 49.9,
        resolutionDaysElapsed: 6,
        resolutionStatus: "open" as const,
      },
      {
        issueId: "issue-001",
        recordDate: new Date("2024-01-17"),
        occurrenceCount: 1,
        impactScore: 49.9,
        resolutionDaysElapsed: 7,
        resolutionStatus: "in_progress" as const,
      },
    ];

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true
    );

    expect(result.issueId).toBe("issue-001");
    expect(result.bottleneckSeverityRank).toBe("low");
    expect(result.bottleneckSeverityScore).toBeLessThan(50);
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.averageResolutionDays).toBe(6);
    expect(result.peakOccurrenceDate).toEqual(new Date("2024-01-15"));
    expect(result.timeSeriesTrendData).toHaveLength(3);
    expect(result.timeSeriesTrendData[0]).toEqual({
      date: new Date("2024-01-15"),
      occurrenceCount: 3,
      impactScore: 49.9,
      resolutionRate: 0,
    });
    expect(result.timeSeriesTrendData[1]).toEqual({
      date: new Date("2024-01-16"),
      occurrenceCount: 2,
      impactScore: 49.9,
      resolutionRate: 0,
    });
    expect(result.timeSeriesTrendData[2]).toEqual({
      date: new Date("2024-01-17"),
      occurrenceCount: 1,
      impactScore: 49.9,
      resolutionRate: 0,
    });
    expect(result.improvementTrend).toBe("stable");
  });
});