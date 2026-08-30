import { generateMonthlyAnalysisReport } from "../../src/logic/monthly-analysis-report";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-090
  test("should throw DataExtractionFailure error when database access fails during monthly report generation", async () => {
    const targetMonth = "2025-01";
    const projectManagerId = "PM-001";
    const includeExecutiveSummary = true;
    const topChallengesCount = 5;

    const mockError = new Error("前月データの抽出に失敗しました。システム管理者に連絡してください。");
    mockError.name = "DataExtractionFailure";

    await expect(
      generateMonthlyAnalysisReport(
        targetMonth,
        projectManagerId,
        includeExecutiveSummary,
        topChallengesCount
      )
    ).rejects.toThrow(/前月データの抽出に失敗しました/);
  });
});