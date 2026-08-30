import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import { type Report } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出・優先度ランク付け", () => {
  // SCEN-225: [error] 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する。 - 課題キーワード辞書が未定義のときという明示された境界条件で課題キーワード辞書が設定されていません。管理者に連絡してください
  test("should throw DataNormalizationFailureError when issue keyword dictionary is undefined", () => {
    const analysisStartDate = new Date("2024-12-16T00:00:00Z");
    const analysisEndDate = new Date("2025-01-15T00:00:00Z");

    const reports: Report[] = [
      {
        reportId: "report-001",
        reportDate: new Date("2025-01-15T09:00:00Z"),
        issueText: "バグが発生している",
        teamId: "team-001",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2025-01-14T09:00:00Z"),
        issueText: "遅延が発生している",
        teamId: "team-002",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2025-01-13T09:00:00Z"),
        issueText: "リソース不足",
        teamId: "team-001",
      },
    ];

    expect(() =>
      extractAndRankIssuesFromReports({
        reports,
        analysisStartDate,
        analysisEndDate,
        teamIds: undefined,
        minimumConfidenceThreshold: 50,
      })
    ).toThrow(/課題キーワード/);
  });
});