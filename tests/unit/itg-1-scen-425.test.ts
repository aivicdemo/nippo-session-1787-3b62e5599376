import { describe, test, expect } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-analysis-report";

describe("generateWeeklyAnalysisReport", () => {
  test("SCEN-425: should throw InsufficientReportDataError when no daily reports exist in the analysis period", () => {
    const analysisStartDate = new Date("2024-01-08");
    const analysisEndDate = new Date("2024-01-14");
    const teamId = "team-001";
    const minimumReportThreshold = 5;

    const aggregatedReportData = {
      reportRecords: [],
      extractedIssues: [],
      dataQualityMetrics: {
        completenessRate: 0,
        deduplicationRate: 0,
        validityRate: 0,
      },
    };

    expect(() =>
      generateWeeklyAnalysisReport(
        analysisStartDate,
        analysisEndDate,
        teamId,
        aggregatedReportData,
        minimumReportThreshold
      )
    ).toThrow(/不足しています/);
  });
});