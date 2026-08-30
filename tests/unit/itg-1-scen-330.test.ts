import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出と優先度付けランキング", () => {
  // SCEN-330: [error] 課題キーワード辞書が空の場合のエラー処理
  test("課題キーワード辞書が未設定の場合、DataNormalizationFailureError をスロー", () => {
    const reports = [
      {
        reportId: "report-001",
        reportDate: new Date("2024-01-15T09:00:00Z"),
        issueText: "ビルドが失敗した",
        teamId: "team-a"
      },
      {
        reportId: "report-002",
        reportDate: new Date("2024-01-15T09:15:00Z"),
        issueText: "テスト環境が不安定",
        teamId: "team-b"
      }
    ];

    const analysisStartDate = new Date("2024-01-08T00:00:00Z");
    const analysisEndDate = new Date("2024-01-15T23:59:59Z");

    expect(() => {
      extractAndRankIssuesFromReports({
        reports,
        analysisStartDate,
        analysisEndDate
      });
    }).toThrow(/正規化/);
  });
});