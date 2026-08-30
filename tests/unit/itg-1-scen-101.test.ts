import { describe, test, expect, jest } from "@jest/globals";
import { calculateProductivityMetrics } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム - 生産性指標計算", () => {
  test("SCEN-101: 指定された集約期間内の日報データから生産性指標を定量化する", () => {
    // Mock dependencies
    jest.mock("../../src/logic/productivity-metrics-calculation", () => {
      const actual = jest.requireActual(
        "../../src/logic/productivity-metrics-calculation"
      );
      return {
        ...actual,
        calculateIssueResolutionSpeed: jest.fn(() => 5.5),
        calculateReportSubmissionRate: jest.fn(() => 92.0),
        calculateIssueRecurrenceRate: jest.fn(() => 8.5),
        calculateTeamProductivityScore: jest.fn(() => 78),
        identifyProductivityAnomalies: jest.fn(() => []),
        validateProductivityAnalysisDataQuality: jest.fn(() => ({
          completeness: 95,
          accuracy: 88,
          trustworthiness: 91,
        })),
      };
    });

    // Input data
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-02-15T23:59:59Z");
    const targetTeamIds = ["team-A"];
    const excludeOutliers = false;

    // Call function
    const result = calculateProductivityMetrics({
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    });

    // Assertions
    expect(result).toBeDefined();
    expect(result.issueResolutionSpeed).toBe(5.5);
    expect(result.reportSubmissionRate).toBe(92.0);
    expect(result.issueRecurrenceRate).toBe(8.5);
    expect(result.teamProductivityScore).toBe(78);
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.dataQualityAssessment).toEqual({
      completeness: 95,
      accuracy: 88,
      trustworthiness: 91,
    });
  });
});