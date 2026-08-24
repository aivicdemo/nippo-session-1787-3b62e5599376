import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";
import type {
  WeeklyAnalysisReportInput,
  WeeklyAnalysisReport,
} from "../../src/logic/weekly-issue-analysis";

describe("週次課題傾向分析レポート生成", () => {
  // SCEN-1677
  test("分析対象日報レコード件数が null のとき分析を中止し警告を返す", () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: "2024-01-08",
      aggregationEndDate: "2024-01-14",
      extractedIssues: [],
      teamId: "team-001",
    };

    const result = generateWeeklyAnalysisReport(input);

    expect(result).toEqual({
      status: "ABORTED",
      message:
        "分析対象日報レコード件数がnullのため、週次課題傾向分析を実行できません",
      errorCode: "ERR_NULL_RECORD_COUNT",
      timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      ),
    });
  });
});