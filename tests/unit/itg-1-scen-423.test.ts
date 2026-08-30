import { describe, test, expect } from "@jest/globals";
import { generateWeeklyAnalysisReport, type WeeklyAnalysisReportInput } from "../../src/logic/weekly-analysis-report";

describe("Weekly Analysis Report Generation", () => {
  // SCEN-423
  test("should throw InvalidAnalysisPeriodError when analysis end date is not a Sunday", () => {
    const input: WeeklyAnalysisReportInput = {
      analysisStartDate: new Date("2024-01-08T00:00:00Z"), // Monday
      analysisEndDate: new Date("2024-01-13T00:00:00Z"), // Saturday (not Sunday)
      teamId: "team-001",
      aggregatedReportData: {
        reportRecords: [
          {
            reportId: "report-001",
            reportDate: new Date("2024-01-08T09:00:00Z"),
            reporterId: "eng-001",
            reportContent: "Completed API development",
            submittedAt: new Date("2024-01-08T08:30:00Z"),
          },
          {
            reportId: "report-002",
            reportDate: new Date("2024-01-09T09:00:00Z"),
            reporterId: "eng-002",
            reportContent: "Fixed database query performance",
            submittedAt: new Date("2024-01-09T08:30:00Z"),
          },
          {
            reportId: "report-003",
            reportDate: new Date("2024-01-10T09:00:00Z"),
            reporterId: "eng-003",
            reportContent: "Reviewed pull requests",
            submittedAt: new Date("2024-01-10T08:30:00Z"),
          },
          {
            reportId: "report-004",
            reportDate: new Date("2024-01-11T09:00:00Z"),
            reporterId: "eng-004",
            reportContent: "Deployed hotfix to production",
            submittedAt: new Date("2024-01-11T08:30:00Z"),
          },
          {
            reportId: "report-005",
            reportDate: new Date("2024-01-12T09:00:00Z"),
            reporterId: "eng-005",
            reportContent: "Updated documentation",
            submittedAt: new Date("2024-01-12T08:30:00Z"),
          },
        ],
        extractedIssues: [
          {
            issueId: "issue-001",
            issueContent: "Database performance degradation",
            reporterTeamId: "team-001",
            occurrenceCount: 2,
          },
          {
            issueId: "issue-002",
            issueContent: "API response time slow",
            reporterTeamId: "team-001",
            occurrenceCount: 1,
          },
        ],
        dataQualityMetrics: {
          completenessRate: 0.95,
          deduplicationRate: 0.92,
          validityRate: 0.98,
        },
      },
      minimumReportThreshold: 5,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/分析対象期間は前週の月曜日から日曜日までの7日間である必要があります/);
  });
});