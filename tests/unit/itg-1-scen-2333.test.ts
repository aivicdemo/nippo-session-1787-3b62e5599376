import { describe, test, expect } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 月次パフォーマンス分析", () => {
  test("SCEN-2333: 課題解決日数が負の値となるときエラーを返す", () => {
    const input: Parameters<typeof extractMonthlyReportData>[0] = {
      targetYear: 2026,
      targetMonth: 8,
      requestedByUserId: "user-001",
      teamIdFilter: ["team-001"],
    };

    const reportDataset = {
      extractionPeriodStart: "2026-08-01T00:00:00Z",
      extractionPeriodEnd: "2026-08-31T23:59:59Z",
      totalReportCount: 1,
      reportsByTeam: [
        {
          teamId: "team-001",
          reportCount: 1,
          submissionRate: 100,
          reportIds: ["report-001"],
        },
      ],
      dataQualityScore: 85,
      extractedAt: "2026-08-20T12:00:00Z",
    };

    const issueData = [
      {
        issueId: "issue-001",
        reportedDate: new Date("2026-08-20T10:00:00Z"),
        resolvedDate: new Date("2026-08-20T09:00:00Z"),
      },
    ];

    const result = extractMonthlyReportData(input, reportDataset, issueData);

    expect(result).toEqual({
      success: false,
      error: "課題解決日時が開始日時より前です。入力値を確認してください",
      data: null,
    });
  });
});