import { describe, test, expect } from "@jest/globals";
import { calculateTeamPerformanceMetrics } from "../../src/logic/monthly-analysis-report";
import type { MonthlyReportDataset, ExtractedIssue } from "../../src/logic/monthly-analysis-report";

describe("calculateTeamPerformanceMetrics", () => {
  // SCEN-094
  test("should throw InvalidTeamIdentifier error when teamId does not exist", () => {
    const invalidTeamId = "INVALID-TEAM-999";
    const teamIds = [invalidTeamId];
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-01-31T23:59:59Z");

    const extractedIssue1: ExtractedIssue = {
      issueId: "issue-001",
      issueContent: "Database connection timeout",
      frequency: 3,
      impactScore: 65,
      reportedDate: "2024-01-10",
      reporterId: "user-001",
    };

    const extractedIssue2: ExtractedIssue = {
      issueId: "issue-002",
      issueContent: "API response delay",
      frequency: 5,
      impactScore: 75,
      reportedDate: "2024-01-15",
      reporterId: "user-002",
    };

    const extractedIssue3: ExtractedIssue = {
      issueId: "issue-003",
      issueContent: "Memory leak in service",
      frequency: 2,
      impactScore: 85,
      reportedDate: "2024-01-20",
      reporterId: "user-003",
    };

    const extractedIssue4: ExtractedIssue = {
      issueId: "issue-004",
      issueContent: "Build failure",
      frequency: 4,
      impactScore: 55,
      reportedDate: "2024-01-25",
      reporterId: "user-004",
    };

    const extractedIssue5: ExtractedIssue = {
      issueId: "issue-005",
      issueContent: "Test flakiness",
      frequency: 6,
      impactScore: 45,
      reportedDate: "2024-01-28",
      reporterId: "user-005",
    };

    const reportDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: "2024-01-01T00:00:00Z",
        endDateTime: "2024-01-31T23:59:59Z",
      },
      totalReportCount: 5,
      reports: [
        {
          reportId: "report-001",
          reportDate: "2024-01-10",
          reporterId: "user-001",
          teamId: "VALID-TEAM-001",
          issues: [extractedIssue1, extractedIssue2],
          submissionTimestamp: "2024-01-10T09:30:00Z",
        },
        {
          reportId: "report-002",
          reportDate: "2024-01-15",
          reporterId: "user-002",
          teamId: "VALID-TEAM-001",
          issues: [extractedIssue3],
          submissionTimestamp: "2024-01-15T09:45:00Z",
        },
        {
          reportId: "report-003",
          reportDate: "2024-01-20",
          reporterId: "user-003",
          teamId: "VALID-TEAM-001",
          issues: [extractedIssue4],
          submissionTimestamp: "2024-01-20T10:00:00Z",
        },
        {
          reportId: "report-004",
          reportDate: "2024-01-25",
          reporterId: "user-004",
          teamId: "VALID-TEAM-001",
          issues: [extractedIssue5],
          submissionTimestamp: "2024-01-25T10:15:00Z",
        },
        {
          reportId: "report-005",
          reportDate: "2024-01-28",
          reporterId: "user-005",
          teamId: "VALID-TEAM-001",
          issues: [],
          submissionTimestamp: "2024-01-28T10:30:00Z",
        },
      ],
      dataQualityScore: 85,
    };

    expect(() =>
      calculateTeamPerformanceMetrics(
        teamIds,
        aggregationStartDate,
        aggregationEndDate,
        reportDataset
      )
    ).toThrow(/INVALID-TEAM-999/);
  });
});