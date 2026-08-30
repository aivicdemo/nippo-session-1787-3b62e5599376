import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-analysis-report";
import type {
  WeeklyAnalysisReportInput,
  AggregatedWeeklyReportData,
  WeeklyReportRecord,
  ExtractedIssue,
} from "../../src/logic/weekly-analysis-report";

describe("generateWeeklyAnalysisReport", () => {
  // SCEN-422: [error] 指定された週の開始日が月曜日ではないときは例外を発生させる
  test("should throw error when analysisStartDate is not a Monday", () => {
    const analysisStartDate = new Date("2026-08-20T00:00:00Z"); // Thursday
    const analysisEndDate = new Date("2026-08-23T23:59:59Z"); // Sunday
    const teamId = "team-001";

    const weeklyReportRecord: WeeklyReportRecord = {
      reportId: "report-001",
      reporterTeamId: teamId,
      submittedAt: new Date("2026-08-19T08:00:00Z"),
      yesterdayWork: "completed task A",
      todayPlan: "plan task B",
      issues: "blocker issue X",
    };

    const extractedIssue: ExtractedIssue = {
      issueId: "issue-001",
      issueContent: "blocker issue X",
      reporterTeamId: teamId,
      occurrenceCount: 1,
    };

    const aggregatedReportData: AggregatedWeeklyReportData = {
      reportRecords: [weeklyReportRecord],
      extractedIssues: [extractedIssue],
      dataQualityMetrics: {
        completenessRate: 0.95,
        deduplicationRate: 0.98,
        validityRate: 0.96,
      },
    };

    const input: WeeklyAnalysisReportInput = {
      analysisStartDate,
      analysisEndDate,
      teamId,
      aggregatedReportData,
      minimumReportThreshold: 5,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(
      /月曜日/
    );
  });
});