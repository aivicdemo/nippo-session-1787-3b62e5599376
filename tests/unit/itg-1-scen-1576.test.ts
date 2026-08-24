import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";
import { type WeeklyAnalysisReportInput } from "../../src/logic/weekly-issue-analysis";

describe("Weekly Issue Analysis Report Generation - Issue ID Validation", () => {
  // SCEN-1576: [error] 週次課題傾向レポート生成機能 - 優先度スコアに必須フィールド（課題ID）が欠落しているときエラーになる
  test("should throw error when issueId is missing in priority score calculation", () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: "2024-01-01",
      aggregationEndDate: "2024-01-07",
      teamId: "team-001",
      extractedIssues: [
        {
          keyword: "バグ",
          occurrenceCount: 5,
          impactScore: 75,
        },
      ],
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/課題ID|issueId|VALIDATION_ERROR_MISSING_ISSUE_ID/);
  });
});