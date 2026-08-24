import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";
import type { WeeklyAnalysisReportInput } from "../../src/logic/weekly-issue-analysis";

describe("週次課題傾向分析レポート生成 - 入力検証", () => {
  // SCEN-1684
  test("分析対象期間の開始日が null のとき分析を中止しエラーを返す", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: null as any,
      aggregationEndDate: "2024-01-07",
      extractedIssues: [
        {
          keyword: "API接続エラー",
          occurrenceCount: 3,
          impactScore: 75,
        },
      ],
      teamId: "team-001",
    };

    expect(() =>
      generateWeeklyAnalysisReport(
        invalidInput,
        mockTextAnalysisServiceAdapter
      )
    ).toThrow(/分析対象期間の開始日/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});