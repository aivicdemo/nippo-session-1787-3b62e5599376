import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告集約分析機能 - 解決日データ不在時のエラー処理", () => {
  test("SCEN-2374: 解決日が未設定の課題レコードが含まれる場合、エラーをスロー", () => {
    // Arrange: テストデータを準備
    const monthlyReportRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: "user-001",
      teamIdFilter: ["team-a"],
    };

    // 解決日がnullの課題レコード
    const unsolvedIssueRecord = {
      issueId: "issue-unresolved-001",
      reportedDate: new Date("2024-01-05T09:00:00Z"),
      resolvedDate: null,
      resolutionDays: null,
    };

    const reportRecords = [
      {
        reportId: "report-001",
        reportDate: new Date("2024-01-05T09:00:00Z"),
        teamId: "team-a",
        reportContent: "テストコンテンツ",
        issueRecords: [unsolvedIssueRecord],
      },
    ];

    // スタブ化されたTextAnalysisServiceAdapter
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: "バグ", frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(45),
      classifyIssueSeverity: jest.fn().mockResolvedValue("medium"),
    };

    // Act & Assert: 解決日データが不在の場合エラーをスロー
    expect(() => {
      extractMonthlyReportData(
        monthlyReportRequest,
        reportRecords,
        textAnalysisServiceAdapterStub
      );
    }).toThrow(/解決日/);
  });
});