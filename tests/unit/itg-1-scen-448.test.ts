import { generateMonthlyAnalysisReport } from "../../src/logic/monthly-analysis-report";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-448
  test("should throw AnalysisValidationFailure when teamMemberIds is empty array", async () => {
    const emptyTeamMemberIds: string[] = [];
    const targetMonth = "2024-01";
    const projectManagerId = "pm-001";
    const includeExecutiveSummary = true;
    const topChallengesCount = 5;

    const mockMonthlyReport = {
      reportId: "report-001",
      reportDate: "2024-01-15",
      reporterId: "engineer-001",
      teamId: "team-001",
      issues: [
        {
          issueId: "issue-001",
          keyword: "ビルド失敗",
          content: "デプロイ時にビルド失敗が発生",
          frequency: 2,
          impactScore: 60,
          resolutionStatus: "unresolved" as const,
          extractedDate: new Date("2024-01-15T09:00:00Z"),
        },
      ],
      submissionTimestamp: "2024-01-15T10:30:00Z",
    };

    const mockReportDataset = {
      extractionPeriod: {
        startDateTime: "2024-01-01T00:00:00Z",
        endDateTime: "2024-01-31T23:59:59Z",
      },
      totalReportCount: 1,
      reports: [mockMonthlyReport],
      dataQualityScore: 85,
    };

    await expect(
      generateMonthlyAnalysisReport({
        targetMonth,
        projectManagerId,
        includeExecutiveSummary,
        topChallengesCount,
        teamMemberIds: emptyTeamMemberIds,
        monthlyReportDataset: mockReportDataset,
        issueResolutionThresholdDays: 7,
      })
    ).rejects.toThrow(/チームメンバー情報が登録されていません/);
  });
});