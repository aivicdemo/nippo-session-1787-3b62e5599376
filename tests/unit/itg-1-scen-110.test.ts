import { validateProductivityAnalysisDataQuality } from "../../src/logic/productivity-metrics-calculation";
import { type ProductivityAnalysisDataset, type ReportRecord, type ExtractedIssueRecord, type ImprovementMeasure } from "../../src/logic/productivity-metrics-calculation";

describe("validateProductivityAnalysisDataQuality", () => {
  // SCEN-110: [error] 分析対象期間のデータ完全性、課題抽出精度、改善施策実行可能性を総合判定し、報告可否を決定する - 集約期間内の日報提出率が基準値（80%）未満、または課題抽出対象レコード数が0件の場合
  test("should return InsufficientDataCompleteness error when submission rate is below 80% and issue count is 0", () => {
    const reportRecords: ReportRecord[] = [
      {
        employeeId: "emp001",
        submittedAt: new Date("2024-01-01T09:00:00Z"),
        yesterdayWork: "Task A completed",
        todayPlan: "Task B planned",
        issues: "Issue 1"
      },
      {
        employeeId: "emp002",
        submittedAt: new Date("2024-01-01T09:15:00Z"),
        yesterdayWork: "Task C completed",
        todayPlan: "Task D planned",
        issues: "Issue 2"
      },
      {
        employeeId: "emp003",
        submittedAt: new Date("2024-01-02T09:00:00Z"),
        yesterdayWork: "Task E completed",
        todayPlan: "Task F planned",
        issues: "Issue 3"
      },
      {
        employeeId: "emp004",
        submittedAt: new Date("2024-01-02T09:30:00Z"),
        yesterdayWork: "Task G completed",
        todayPlan: "Task H planned",
        issues: "Issue 4"
      },
      {
        employeeId: "emp005",
        submittedAt: new Date("2024-01-03T09:00:00Z"),
        yesterdayWork: "Task I completed",
        todayPlan: "Task J planned",
        issues: "Issue 5"
      },
      {
        employeeId: "emp006",
        submittedAt: new Date("2024-01-03T09:45:00Z"),
        yesterdayWork: "Task K completed",
        todayPlan: "Task L planned",
        issues: "Issue 6"
      },
      {
        employeeId: "emp007",
        submittedAt: new Date("2024-01-04T09:00:00Z"),
        yesterdayWork: "Task M completed",
        todayPlan: "Task N planned",
        issues: "Issue 7"
      }
    ];

    const extractedIssueRecords: ExtractedIssueRecord[] = [];

    const improvementMeasures: ImprovementMeasure[] = [];

    const analysisDataset: ProductivityAnalysisDataset = {
      aggregationPeriodStartDate: new Date("2024-01-01T00:00:00Z"),
      aggregationPeriodEndDate: new Date("2024-01-31T23:59:59Z"),
      reportDataset: reportRecords,
      extractedIssueDataset: extractedIssueRecords,
      proposedImprovementMeasures: improvementMeasures,
      teamMemberCount: 10
    };

    const result = validateProductivityAnalysisDataQuality(analysisDataset);

    expect(result.isValid).toBe(false);

    const insufficientDataError = result.validationErrors.find(
      (error) => error.errorCode === "InsufficientDataCompleteness"
    );

    expect(insufficientDataError).toBeDefined();
    expect(insufficientDataError?.errorMessage).toBe(
      "分析対象期間のデータ完全性が不足しています。提出率: 70%, 課題抽出件数: 0件。基準値以上のデータ収集後に再実行してください。"
    );
  });
});