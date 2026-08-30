import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-analysis-report";

describe("Weekly Analysis Report Generation", () => {
  // SCEN-428
  test("should throw InsufficientReportDataError when aggregatedReportData is null", () => {
    const analysisStartDate = new Date("2024-01-08");
    const analysisEndDate = new Date("2024-01-14");
    const teamId = "team-001";
    const minimumReportThreshold = 5;

    expect(() =>
      generateWeeklyAnalysisReport({
        analysisStartDate,
        analysisEndDate,
        teamId,
        aggregatedReportData: null as any,
        minimumReportThreshold,
      })
    ).toThrow(/分析対象の日報データが見つかりません/);
  });
});